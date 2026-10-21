const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const folder = '/internal/current/'
const getCurrentDate = () => new Date().toLocaleDateString('en-GB')
const overrideTypes = {
  updateCol: 'Water availability colour',
  updateHof: 'Hands-off Flow'
}

router.use((request, response, next) => {
 const requestPath = request.baseUrl + request.path
 if (requestPath.startsWith(folder)) {
  response.locals.internalCurrent = true
  response.locals.internalStartPage = requestPath === folder + 'start'
  response.locals.internalSignedInEmail = request.session.data.email || ''
 }
 next()
})

router.get('/sign-out', (request, response) => {
 request.session.data.email = ''
 response.redirect(folder + 'start')
})

const getCatchmentChildren = async (type, catchmentName, catchmentId) => {
 const id = String(catchmentId || '').trim()
 const name = String(catchmentName || '').trim()

 if (!id && !name) {
   return []
 }

 const isManagementCatchment = type === 'managementCatchment'
 const idField = isManagementCatchment ? 'MANCAT_ID' : 'OPCAT_ID'
 const nameField = isManagementCatchment ? 'MNCAT_NAME' : 'OPCAT_NAME'
 const childIdField = isManagementCatchment ? 'OPCAT_ID' : 'WB_ID'
 const childNameField = isManagementCatchment ? 'OPCAT_NAME' : 'WB_NAME'
 const whereClause = id
   ? `UPPER(${idField}) = '${id.toUpperCase()}'`
   : `UPPER(${nameField}) = '${name.toUpperCase()}'`

 const url =
 'https://services1.arcgis.com/JZM7qJpmv7vJ0Hzx/ArcGIS/rest/services/' +
 'WFD_Cycle_2_River_catchment_classification/' +
 'FeatureServer/5/query?' +
 'where=' +
 encodeURIComponent(whereClause) +
 '&outFields=WB_ID,WB_NAME,MANCAT_ID,MNCAT_NAME,OPCAT_ID,OPCAT_NAME' +
 '&returnGeometry=false' +
 '&f=pjson'

 const response = await fetch(url)
 if (!response.ok) {
   throw new Error(`Catchment lookup failed with status ${response.status}`)
 }
 const data = await response.json()
 if (data.error) {
   throw new Error(`Catchment lookup failed: ${data.error.message || 'unknown ArcGIS error'}`)
 }
 const rows = (data.features || [])
   .map(feature => feature.attributes || {})
   .filter(attrs => attrs[childIdField] && attrs[childNameField])

 if (!isManagementCatchment) {
   const seen = new Set()
   return rows
     .filter(attrs => {
       const key = attrs[childIdField]
       if (seen.has(key)) {
         return false
       }

       seen.add(key)
       return true
     })
     .map(attrs => ({
       id: attrs[childIdField],
       name: attrs[childNameField],
       managementCatchmentId: attrs.MANCAT_ID,
       managementCatchment: attrs.MNCAT_NAME
     }))
 }

 const childrenById = new Map()
 rows.forEach(attrs => {
   const id = attrs[childIdField]
   if (!childrenById.has(id)) {
     childrenById.set(id, { id, name: attrs[childNameField], waterbodies: [] })
   }

   if (attrs.WB_ID && attrs.WB_NAME) {
     childrenById.get(id).waterbodies.push({ id: attrs.WB_ID, name: attrs.WB_NAME })
   }
 })

 return Array.from(childrenById.values()).map(child => ({
   ...child,
   waterbodies: child.waterbodies.filter((waterbody, index, waterbodies) =>
     waterbodies.findIndex(candidate => candidate.id === waterbody.id) === index
   )
 }))
}

const getEntityKey = entity => `${entity.type}:${entity.id || entity.name}`

const getCurrentEntity = data => {
  const type = data.selectedType
  if (type === 'waterbody') {
    return { type, id: data.waterBodyId, name: data.waterBodyName }
  }
  if (type === 'operationalCatchment') {
    return {
      type,
      id: data.operationalCatchmentId,
      name: data.operationalCatchment,
      managementCatchmentId: data.managementCatchmentId,
      managementCatchment: data.managementCatchment
    }
  }
  return { type: 'managementCatchment', id: data.managementCatchmentId, name: data.managementCatchment }
}

const getLocalOverrides = data => data.localOverrides || (data.localOverrides = {})
const getGlobalOverrides = data => data.globalOverrides || (data.globalOverrides = [])
const getOverrideHistory = data => data.overrideHistory || (data.overrideHistory = {})

const addLocalOverrideHistory = (data, entity, type, action, override, previousValue) => {
  const entityKey = getEntityKey(entity)
  const history = getOverrideHistory(data)
  history[entityKey] = history[entityKey] || {}
  history[entityKey][type] = history[entityKey][type] || []
  history[entityKey][type].push({
    action,
    value: override.value,
    previousValue,
    date: getCurrentDate(),
    notes: override.notes || '',
    entity,
    email: data.email || 'Not recorded',
    createdAt: Date.now()
  })
}

const getGlobalForEntity = (data, type, entity) => {
  const key = getEntityKey(entity)
  return getGlobalOverrides(data)
    .flatMap(record => (record.type === type ? record.targets || [] : [])
      .filter(target => target.key === key && target.applied)
      .map(target => ({ record, target })))
    .pop()
}

const getEffectiveOverride = (data, type, entity) => {
  const local = getLocalOverrides(data)[getEntityKey(entity)]
  const inherited = getGlobalForEntity(data, type, entity)
  const hasLocal = local && local[type] && local[type].value !== 'No override set'
  const localIsNewer = hasLocal &&
    (!inherited || Number(local[type].createdAt || 0) >= inherited.record.createdAt)

  if (localIsNewer) {
    return { ...local[type], source: 'local', sourceEntity: entity }
  }

  if (inherited) {
    return {
      value: inherited.record.value,
      date: inherited.record.date,
      notes: inherited.record.notes,
      source: 'global',
      sourceEntity: inherited.record.source,
      sourceRecordId: inherited.record.id,
      createdAt: inherited.record.createdAt
    }
  }

  return { value: 'N/A', date: 'N/A', notes: '', source: 'none' }
}

const isGlobalOverrideEffective = (data, record, target) => {
  const effective = getEffectiveOverride(data, record.type, target)
  return effective.source === 'global' && effective.sourceRecordId === record.id
}

const getGlobalTargetStatus = (data, record, target) => {
  if (target.status === 'kept') {
    return 'Existing override kept'
  }
  if (isGlobalOverrideEffective(data, record, target)) {
    return 'Override applied'
  }
  const effective = getEffectiveOverride(data, record.type, target)
  if (effective.source === 'local') {
    return 'Superseded by a local override'
  }
  if (effective.source === 'global') {
    return 'Superseded by a later override'
  }
  return target.status || 'Not applied'
}

const getOverrideDisplayValue = (type, value) => {
  if (type === 'updateCol') {
    return String(value || '').replace(/<[^>]*>/g, '')
  }
  return String(value || '')
}

const getTargetsForSource = async (source, selectedIds) => {
  const children = await getCatchmentChildren(source.type, source.name, source.id)
  const selected = selectedIds
    ? children.filter(child => selectedIds.includes(String(child.id)))
    : children

  if (source.type === 'managementCatchment') {
    return selected.flatMap(child => [
      {
        type: 'operationalCatchment',
        id: child.id,
        name: child.name,
        managementCatchmentId: source.id,
        managementCatchment: source.name
      },
      ...(child.waterbodies || []).map(waterbody => ({
        type: 'waterbody',
        id: waterbody.id,
        name: waterbody.name,
        operationalCatchmentId: child.id,
        operationalCatchment: child.name,
        managementCatchmentId: source.id,
        managementCatchment: source.name
      }))
    ])
  }

  return selected.map(child => ({
    type: 'waterbody',
    id: child.id,
    name: child.name,
    operationalCatchmentId: source.id,
    operationalCatchment: source.name,
    managementCatchmentId: source.managementCatchmentId,
    managementCatchment: source.managementCatchment
  }))
}

const getCurrentConflict = (data, type, entity) => {
  const effective = getEffectiveOverride(data, type, entity)
  if (effective.source === 'local') {
    return { value: effective.value, source: 'Local override' }
  }
  if (effective.source === 'global') {
    return {
      value: effective.value,
      source: `Global override from ${effective.sourceEntity.name}`
    }
  }

  return null
}

const makeSummaryUrl = entity => {
  const params = new URLSearchParams({ selectedType: entity.type })
  if (entity.type === 'waterbody') {
    params.set('waterBodyId', entity.id)
    params.set('waterBodyName', entity.name)
    params.set('operationalCatchmentId', entity.operationalCatchmentId || '')
    params.set('operationalCatchment', entity.operationalCatchment || '')
    params.set('managementCatchmentId', entity.managementCatchmentId || '')
    params.set('managementCatchment', entity.managementCatchment || '')
  } else if (entity.type === 'operationalCatchment') {
    params.set('operationalCatchmentId', entity.id)
    params.set('operationalCatchment', entity.name)
    params.set('managementCatchmentId', entity.managementCatchmentId || '')
    params.set('managementCatchment', entity.managementCatchment || '')
  } else {
    params.set('managementCatchmentId', entity.id)
    params.set('managementCatchment', entity.name)
  }
  return `/internal/current/manual-overrides-summary?${params.toString()}`
}

const saveGlobalOverride = (data, targets, replaceChoices) => {
  const pending = data.pendingOverride
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: pending.type,
    value: pending.value,
    date: pending.date,
    notes: pending.notes,
    source: pending.source,
    scope: pending.scope || 'selected',
    createdByEmail: data.email || 'Not recorded',
    createdAt: Date.now(),
    targets: targets.map(target => {
      const conflict = getCurrentConflict(data, pending.type, target)
      const previousOverride = getEffectiveOverride(data, pending.type, target)
      const key = getEntityKey(target)
      const replace = conflict
        ? (replaceChoices[key] === undefined ? false : replaceChoices[key])
        : true
      return {
        ...target,
        key,
        applied: replace,
        status: replace ? 'applied' : (conflict ? 'kept' : 'not applied'),
        previousValue: replace && previousOverride.source !== 'none'
          ? previousOverride.value
          : undefined
      }
    })
  }
  record.targets.forEach(target => {
    if (!target.applied) {
      return
    }
    getGlobalOverrides(data)
      .filter(previous => previous.type === record.type)
      .forEach(previous => {
        const previousTarget = previous.targets.find(candidate =>
          candidate.key === target.key && (candidate.applied || candidate.status === 'kept')
        )
        if (previousTarget) {
          previousTarget.applied = false
          previousTarget.status = 'superseded'
          previousTarget.supersededBy = record.id
          previousTarget.statusDate = getCurrentDate()
          previousTarget.statusEmail = data.email || 'Not recorded'
        }
      })
  })
  getGlobalOverrides(data).push(record)
  delete data.pendingOverride
  delete data.overrideCandidates
  delete data.overrideTargets
  delete data.overrideConflicts
  return record
}

router.get('/hello', (req, res) => {
 res.send('Hello world')
})

const normalizeText = value =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const levenshteinDistance = (a, b) => {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  return matrix[a.length][b.length]
}

const matchesQuery = (fieldValue, queryText) => {
  const value = String(fieldValue || '')
  const exact = value.toUpperCase().includes(queryText)

  if (exact) {
    return true
  }

  const normalizedValue = normalizeText(value)
  const normalizedQuery = normalizeText(queryText)

  if (!normalizedValue || !normalizedQuery || normalizedValue.length < 4) {
    return false
  }

  const maxLength = Math.max(normalizedValue.length, normalizedQuery.length)
  const distance = levenshteinDistance(normalizedValue, normalizedQuery)
  const similarity = 1 - (distance / maxLength)

  return similarity >= 0.75
}

router.get('/api/catchments/search', async (req, res) => {

 try {

 const query = req.query.q || ''

 if (query.length < 3) {
 return res.json([])
 }

 const queryText = query.trim().toUpperCase()
 const exactUrl =
 'https://services1.arcgis.com/JZM7qJpmv7vJ0Hzx/ArcGIS/rest/services/' +
 'WFD_Cycle_2_River_catchment_classification/' +
 'FeatureServer/5/query?' +
 'where=' +
 encodeURIComponent(
 `UPPER(WB_NAME) LIKE '%${queryText}%' OR UPPER(OPCAT_NAME) LIKE '%${queryText}%' OR UPPER(MNCAT_NAME) LIKE '%${queryText}%'`
 ) +
 '&outFields=WB_ID,WB_NAME,MANCAT_ID,MNCAT_NAME,OPCAT_ID,OPCAT_NAME' +
 '&returnGeometry=false' +
 '&f=pjson'

 const response = await fetch(exactUrl)
 const exactData = await response.json()
 const seen = new Set()
 const results = []

 ;(exactData.features || []).forEach(feature => {
   const attrs = feature.attributes || {}
   const fields = [
    { value: attrs.WB_NAME, type: 'waterbody', id: attrs.WB_ID },
    { value: attrs.OPCAT_NAME, type: 'operationalCatchment', id: attrs.OPCAT_ID },
    { value: attrs.MNCAT_NAME, type: 'managementCatchment', id: attrs.MANCAT_ID }
   ]

   fields.forEach(field => {
     const value = field.value

     if (!value || !matchesQuery(value, queryText)) {
       return
     }

     const key = `${field.type}:${value}`

     if (seen.has(key)) {
       return
     }

     seen.add(key)

     results.push({
       id: field.id || value,
       name: value,
      managementCatchment: attrs.MNCAT_NAME || '',
      managementCatchmentId: attrs.MANCAT_ID || '',
       operationalCatchment: attrs.OPCAT_NAME || value,
      operationalCatchmentId: attrs.OPCAT_ID || '',
       type: field.type
     })
   })
 })

 if (results.length > 0) {
   return res.json(results)
 }

 const fallbackUrl =
 'https://services1.arcgis.com/JZM7qJpmv7vJ0Hzx/ArcGIS/rest/services/' +
 'WFD_Cycle_2_River_catchment_classification/' +
 'FeatureServer/5/query?' +
 'where=1%3D1' +
 '&outFields=WB_ID,WB_NAME,MANCAT_ID,MNCAT_NAME,OPCAT_ID,OPCAT_NAME' +
 '&returnGeometry=false' +
 '&resultRecordCount=5000' +
 '&f=pjson'

 const fallbackResponse = await fetch(fallbackUrl)
 const fallbackData = await fallbackResponse.json()

 ;(fallbackData.features || []).forEach(feature => {
   const attrs = feature.attributes || {}
   const fields = [
    { value: attrs.WB_NAME, type: 'waterbody', id: attrs.WB_ID },
    { value: attrs.OPCAT_NAME, type: 'operationalCatchment', id: attrs.OPCAT_ID },
    { value: attrs.MNCAT_NAME, type: 'managementCatchment', id: attrs.MANCAT_ID }
   ]

   fields.forEach(field => {
     const value = field.value

     if (!value || !matchesQuery(value, queryText)) {
       return
     }

     const key = `${field.type}:${value}`

     if (seen.has(key)) {
       return
     }

     seen.add(key)

     results.push({
       id: field.id || value,
       name: value,
      managementCatchment: attrs.MNCAT_NAME || '',
      managementCatchmentId: attrs.MANCAT_ID || '',
       operationalCatchment: attrs.OPCAT_NAME || value,
      operationalCatchmentId: attrs.OPCAT_ID || '',
       type: field.type
     })
   })
 })

 return res.json(results)

 } catch (error) {

 console.error(error)

 return res.json([])

 }

})

//OVERRIDES
//const currentRoutes = require('./views/internal/current/_routes')
//router.use('/', currentRoutes)

router.get(folder + 'manual-overrides-summary', async function (request, response, next) {
	const querySelectedType = request.query.selectedType
	const queryWaterBodyName = request.query.waterBodyName || ''
  const queryManagementCatchment = request.query.managementCatchment || ''
  const queryManagementCatchmentId = request.query.managementCatchmentId || ''
  const queryOperationalCatchment = request.query.operationalCatchment || ''
  const queryOperationalCatchmentId = request.query.operationalCatchmentId || ''
	const queryWaterBodyId = request.query.waterBodyId || ''

	const selectedType = querySelectedType ||
    (queryWaterBodyId ? 'waterbody' : (queryOperationalCatchmentId || queryOperationalCatchment ? 'operationalCatchment' : (queryManagementCatchmentId || queryManagementCatchment ? 'managementCatchment' : (request.session.data.selectedType || ''))))

	const waterBodyName = selectedType === 'waterbody' ? (queryWaterBodyName || request.session.data.waterBodyName || '') : ''
  const hasExplicitSelection = Boolean(querySelectedType)
  let managementCatchment = queryManagementCatchment || (hasExplicitSelection ? '' : request.session.data.managementCatchment || '')
  let managementCatchmentId = queryManagementCatchmentId || (hasExplicitSelection ? '' : request.session.data.managementCatchmentId || '')
  const operationalCatchment = queryOperationalCatchment || (hasExplicitSelection ? '' : request.session.data.operationalCatchment || '')
  const operationalCatchmentId = queryOperationalCatchmentId || (hasExplicitSelection ? '' : request.session.data.operationalCatchmentId || '')
	const waterBodyId = selectedType === 'waterbody' ? (queryWaterBodyId || request.session.data.waterBodyId || '') : ''
  let children = []
  try {
    children = selectedType === 'managementCatchment' && (managementCatchment || managementCatchmentId)
      ? await getCatchmentChildren('managementCatchment', managementCatchment, managementCatchmentId)
      : selectedType === 'operationalCatchment' && (operationalCatchment || operationalCatchmentId)
        ? await getCatchmentChildren('operationalCatchment', operationalCatchment, operationalCatchmentId)
        : []
  } catch (error) {
    return next(error)
  }
  if (selectedType === 'operationalCatchment' && children.length) {
    managementCatchment = managementCatchment || children[0].managementCatchment || ''
    managementCatchmentId = managementCatchmentId || children[0].managementCatchmentId || ''
  }

	request.session.data.selectedType = selectedType
	request.session.data.waterBodyName = selectedType === 'waterbody' ? waterBodyName : ''
  request.session.data.managementCatchment = managementCatchment
  request.session.data.managementCatchmentId = managementCatchmentId
  request.session.data.operationalCatchment = operationalCatchment
  request.session.data.operationalCatchmentId = operationalCatchmentId
	request.session.data.waterBodyId = selectedType === 'waterbody' ? waterBodyId : ''
	request.session.data.hierarchyChildren = children
  const currentEntity = getCurrentEntity(request.session.data)
  request.session.data.currentOverrideEntity = currentEntity
  const effectiveOverrides = {
    updateCol: getEffectiveOverride(request.session.data, 'updateCol', currentEntity),
    updateHof: getEffectiveOverride(request.session.data, 'updateHof', currentEntity)
  }
  const entityKey = getEntityKey(currentEntity)
  const localOverridesForCurrentEntity = getLocalOverrides(request.session.data)[entityKey] || {}
  const globalOverrideSummaries = getGlobalOverrides(request.session.data)
    .filter(record => getEntityKey(record.source) === entityKey)
    .filter(record => record.targets.some(target => target.applied || target.status === 'kept'))
    .map(record => {
      const details = record.targets
        .filter(target => target.applied || target.status === 'kept')
        .map(target => ({
          ...target,
          url: makeSummaryUrl(target),
          status: getGlobalTargetStatus(request.session.data, record, target)
        }))
      const appliedCount = record.targets.filter(target =>
        isGlobalOverrideEffective(request.session.data, record, target)
      ).length
      const keptCount = record.targets.filter(target => target.status === 'kept').length
      return {
        ...record,
        label: overrideTypes[record.type],
        displayValue: getOverrideDisplayValue(record.type, record.value),
        appliedCount,
        keptCount,
        totalCount: record.targets.filter(target => target.applied || target.status === 'kept').length,
        details
      }
    })
  const includesAllWaterBodies = record =>
    children.length > 0 &&
    children.every(child => record.targets.some(target =>
      target.type === 'waterbody' &&
      String(target.id) === String(child.id) &&
      (target.applied || target.status === 'kept')
    ))
  const operationalWaterBodyOverrideRecords = ['updateCol', 'updateHof'].reduce((overrides, type) => {
    overrides[type] = getGlobalOverrides(request.session.data)
      .filter(record =>
        record.type === type &&
        getEntityKey(record.source) === entityKey &&
        record.source.type === 'operationalCatchment'
      )
      .map(record => {
        const waterBodies = record.targets
          .filter(target => target.type === 'waterbody' && (target.applied || target.status === 'kept'))
          .map(target => ({
            ...target,
            url: makeSummaryUrl(target),
            status: getGlobalTargetStatus(request.session.data, record, target)
          }))
        const appliedCount = waterBodies.filter(waterBody =>
          isGlobalOverrideEffective(request.session.data, record, waterBody)
        ).length
        const keptCount = waterBodies.filter(waterBody => waterBody.status === 'Existing override kept').length
        return {
          ...record,
          displayValue: getOverrideDisplayValue(type, record.value),
          isAllWaterBodies: includesAllWaterBodies(record),
          waterBodies,
          appliedCount,
          keptCount,
          totalCount: waterBodies.length
        }
      })
      .filter(record => record.totalCount > 0)
    return overrides
  }, {})
  const selectedWaterBodyOverrides = ['updateCol', 'updateHof'].reduce((overrides, type) => {
    overrides[type] = operationalWaterBodyOverrideRecords[type]
      .filter(record => !record.isAllWaterBodies)
    return overrides
  }, {})
  const allWaterBodyOverrides = ['updateCol', 'updateHof'].reduce((overrides, type) => {
    overrides[type] = operationalWaterBodyOverrideRecords[type]
      .filter(record => record.isAllWaterBodies)
    return overrides
  }, {})
  const operationalOverrideRecordIds = new Set(
    selectedWaterBodyOverrides.updateCol
      .concat(selectedWaterBodyOverrides.updateHof)
      .concat(allWaterBodyOverrides.updateCol)
      .concat(allWaterBodyOverrides.updateHof)
      .map(record => record.id)
  )
  const catchmentLevelOverrideSummaries = globalOverrideSummaries.filter(record =>
    !operationalOverrideRecordIds.has(record.id)
  )
  const inheritedOverrides = ['updateCol', 'updateHof']
    .flatMap(type => getGlobalOverrides(request.session.data)
      .filter(record => record.type === type && record.targets.some(target =>
        target.key === entityKey &&
        target.applied &&
        isGlobalOverrideEffective(request.session.data, record, target)
      ))
      .map(record => ({
        type,
        label: overrideTypes[type],
        value: record.value,
        displayValue: getOverrideDisplayValue(type, record.value),
        source: record.source,
        sourceUrl: makeSummaryUrl(record.source),
        date: record.date,
        notes: record.notes || ''
      })))
  const overrideHistory = ['updateCol', 'updateHof'].reduce((history, type) => {
    const localHistory = (getOverrideHistory(request.session.data)[entityKey] || {})[type] || []
    const currentLocalOverride = getLocalOverrides(request.session.data)[entityKey] &&
      getLocalOverrides(request.session.data)[entityKey][type]
    const localHistoryWithCurrent = currentLocalOverride && !localHistory.some(entry =>
      entry.action === 'applied' &&
      entry.value === currentLocalOverride.value &&
      entry.date === currentLocalOverride.date
    )
      ? localHistory.concat({
          action: 'applied',
          value: currentLocalOverride.value,
          previousValue: undefined,
          date: currentLocalOverride.date,
          notes: currentLocalOverride.notes || '',
          entity: currentEntity,
          email: 'Not recorded',
          createdAt: currentLocalOverride.createdAt || 0
        })
      : localHistory
    const globalHistory = getGlobalOverrides(request.session.data)
      .filter(record => record.type === type)
      .flatMap(record => {
        const isSource = getEntityKey(record.source) === entityKey
        const matchingTargets = record.targets.filter(target => target.key === entityKey)
        if (!isSource && !matchingTargets.length) {
          return []
        }
        const relevantTargets = isSource ? record.targets : matchingTargets
        const statusCount = (status, predicate) =>
          relevantTargets.filter(target => predicate ? predicate(target) : target.status === status).length
        const statusText = isSource
          ? [
              `${relevantTargets.filter(target => isGlobalOverrideEffective(request.session.data, record, target)).length} applied`,
              `${relevantTargets.filter(target => target.applied && getEffectiveOverride(request.session.data, type, target).source === 'local').length} superseded by local overrides`,
              `${statusCount('kept')} kept`,
              `${statusCount('superseded')} superseded`,
              `${statusCount('removed')} removed`
            ].filter(text => !text.startsWith('0 ')).join(', ') || 'No descendants currently have this override'
          : matchingTargets.map(target => {
              const statuses = {
                applied: 'Applied',
                kept: 'Existing override kept',
                superseded: 'Superseded by a later override',
                removed: 'Removed',
                'not applied': 'Not applied'
              }
              const targetStatus = target.status || (target.applied ? 'applied' : 'not applied')
              return target.applied
                ? getGlobalTargetStatus(request.session.data, record, target)
                : statuses[targetStatus] || 'Not applied'
            }).join(', ')
        return [{
          value: getOverrideDisplayValue(type, record.value),
          displayValue: getOverrideDisplayValue(type, record.value),
          previousDisplayValue: !isSource && matchingTargets[0].previousValue !== undefined
            ? getOverrideDisplayValue(type, matchingTargets[0].previousValue)
            : '',
          date: record.date,
          notes: record.notes || '',
          source: record.source,
          sourceUrl: makeSummaryUrl(record.source),
          scope: record.scope,
          status: statusText,
          statusDate: relevantTargets.find(target => target.statusDate)?.statusDate,
          email: record.createdByEmail || 'Not recorded',
          statusEmail: relevantTargets.find(target => target.statusEmail)?.statusEmail,
          createdAt: record.createdAt || 0
        }]
      })
    history[type] = localHistoryWithCurrent.map(entry => ({
      ...entry,
      displayValue: getOverrideDisplayValue(type, entry.value),
      previousDisplayValue: entry.previousValue === undefined
        ? ''
        : getOverrideDisplayValue(type, entry.previousValue),
      status: entry.action === 'removed' ? 'Removed' : 'Applied locally',
      sourceName: entry.entity.name,
      createdAt: entry.createdAt || 0
    })).concat(globalHistory)
      .sort((first, second) => second.createdAt - first.createdAt)
    return history
  }, {})

  response.render(folder + 'manual-overrides-summary', {
    selectedType,
		waterBodyName,
    managementCatchment,
    managementCatchmentId,
    operationalCatchment,
    operationalCatchmentId,
		waterBodyId,
		hierarchyChildren: children,
    effectiveOverrides,
    localOverridesForCurrentEntity,
    globalOverrideSummaries: catchmentLevelOverrideSummaries,
    selectedWaterBodyOverrides,
    allWaterBodyOverrides,
    inheritedOverrides,
    overrideHistory,
    data: request.session.data
	})
})

router.post('/manual-overrides-summary', function (request, response) {
	const upDate = request.body['manual-overrides-summary'] || request.session.data['manual-overrides-summary']
	if (upDate == "updateAp") {
    response.redirect(folder + "update-ap")
	} else if (upDate == "updateHof") {
		response.redirect(folder + "update-hof")
	} else if (upDate == "updateLp") {
		response.redirect(folder + "update-lp")
	} else if (upDate == "updateCol") {
		response.redirect(folder + "update-col")
	} else if (upDate == "updateHmwb") {
		response.redirect(folder + "update-hmwb")
  } else if (upDate === 'removeLocal:updateCol' || upDate === 'removeLocal:updateHof') {
    const type = upDate.split(':')[1]
    const data = request.session.data
    const entity = data.currentOverrideEntity || getCurrentEntity(data)
    const localOverrides = getLocalOverrides(data)
    const entityKey = getEntityKey(entity)
    const localOverride = localOverrides[entityKey] && localOverrides[entityKey][type]
    if (localOverride) {
      addLocalOverrideHistory(data, entity, type, 'removed', localOverride, localOverride.value)
      delete localOverrides[entityKey][type]
    }
    response.redirect(folder + 'manual-overrides-summary')
  } else if (String(upDate).startsWith('removeGlobal:')) {
    request.session.data.pendingGlobalRemovalId = String(upDate).split(':').slice(1).join(':')
    response.redirect(folder + 'remove-global')
	}
})

router.post(folder + 'start', function (request, response) {
	request.session.data.email = request.body.email
	response.redirect(folder + 'catchment-search')
})

router.post(folder + 'update-ap', function (request, response) {
	request.session.data.updateAp = request.body.updateAp
	response.redirect(folder + 'manual-overrides-summary')
})

router.post(folder + 'update-col', function (request, response) {
  if (!request.body.updateCol) {
    return response.status(400).render(folder + 'update-col', {
      error: 'Select an availability colour or choose to remove the override.'
    })
  }
  const currentEntity = request.session.data.currentOverrideEntity || getCurrentEntity(request.session.data)
  const localOverrides = getLocalOverrides(request.session.data)
  const entityKey = getEntityKey(currentEntity)
  if (request.body.updateCol === 'No override set') {
    if (localOverrides[entityKey] && localOverrides[entityKey].updateCol) {
      const removedOverride = localOverrides[entityKey].updateCol
      addLocalOverrideHistory(request.session.data, currentEntity, 'updateCol', 'removed', removedOverride, removedOverride.value)
      delete localOverrides[entityKey].updateCol
    }
    return response.redirect(folder + 'manual-overrides-summary')
  }

  const date = getCurrentDate()
  if (currentEntity.type === 'managementCatchment' || currentEntity.type === 'operationalCatchment') {
    request.session.data.pendingOverride = {
      type: 'updateCol',
      value: request.body.updateCol,
      date,
      notes: request.body.moreDetailCol || '',
      source: currentEntity
    }
    return response.redirect(folder + 'override-scope')
  }

  const previousOverride = getEffectiveOverride(request.session.data, 'updateCol', currentEntity)
  localOverrides[entityKey] = localOverrides[entityKey] || {}
  localOverrides[entityKey].updateCol = {
    value: request.body.updateCol,
    date,
    notes: request.body.moreDetailCol || '',
    createdAt: Date.now()
  }
  addLocalOverrideHistory(
    request.session.data,
    currentEntity,
    'updateCol',
    'applied',
    localOverrides[entityKey].updateCol,
    previousOverride.source === 'none' ? undefined : previousOverride.value
  )
	response.redirect(folder + 'manual-overrides-summary')
})

router.post(folder + 'update-hof', function (request, response) {
  const value = request.body.updateHof === 'custom' ? request.body.updateHofValue : request.body.updateHof
  if (!value || value === 'custom') {
    return response.status(400).render(folder + 'update-hof', {
      error: request.body.updateHof === 'custom'
        ? 'Enter a Hands-off Flow value.'
        : 'Select a Hands-off Flow option.'
    })
  }
  const currentEntity = request.session.data.currentOverrideEntity || getCurrentEntity(request.session.data)
  const localOverrides = getLocalOverrides(request.session.data)
  const entityKey = getEntityKey(currentEntity)
  if (value === 'No override set') {
    if (localOverrides[entityKey] && localOverrides[entityKey].updateHof) {
      const removedOverride = localOverrides[entityKey].updateHof
      addLocalOverrideHistory(request.session.data, currentEntity, 'updateHof', 'removed', removedOverride, removedOverride.value)
      delete localOverrides[entityKey].updateHof
    }
    return response.redirect(folder + 'manual-overrides-summary')
  }

  const date = getCurrentDate()
  if (currentEntity.type === 'managementCatchment' || currentEntity.type === 'operationalCatchment') {
    request.session.data.pendingOverride = {
      type: 'updateHof',
      value,
      date,
      notes: request.body.moreDetailHof || '',
      source: currentEntity
    }
    return response.redirect(folder + 'override-scope')
  }

  const previousOverride = getEffectiveOverride(request.session.data, 'updateHof', currentEntity)
  localOverrides[entityKey] = localOverrides[entityKey] || {}
  localOverrides[entityKey].updateHof = {
    value,
    date,
    notes: request.body.moreDetailHof || '',
    createdAt: Date.now()
  }
  addLocalOverrideHistory(
    request.session.data,
    currentEntity,
    'updateHof',
    'applied',
    localOverrides[entityKey].updateHof,
    previousOverride.source === 'none' ? undefined : previousOverride.value
  )
	response.redirect(folder + 'manual-overrides-summary')
})

router.get(folder + 'override-scope', (request, response) => {
  const pending = request.session.data.pendingOverride
  if (!pending) {
    return response.redirect(folder + 'manual-overrides-summary')
  }

  response.render(folder + 'override-scope', {
    pending,
    overrideLabel: overrideTypes[pending.type],
    childLabel: pending.source.type === 'managementCatchment' ? 'operational catchments' : 'water bodies',
    error: request.session.data.overrideTargetError
  })
  delete request.session.data.overrideTargetError
})

router.get(folder + 'cancel-override', (request, response) => {
  const data = request.session.data
  delete data.pendingOverride
  delete data.overrideCandidates
  delete data.overrideTargets
  delete data.overrideConflicts
  delete data.overrideSelectionError
  delete data.overrideTargetError
  response.redirect(folder + 'manual-overrides-summary')
})

router.post(folder + 'override-scope', async (request, response, next) => {
  const pending = request.session.data.pendingOverride
  if (!pending) {
    return response.redirect(folder + 'manual-overrides-summary')
  }
  if (request.body.scopeDecision === 'selected') {
    pending.scope = 'selected'
    return response.redirect(folder + 'override-descendants')
  }
  if (request.body.scopeDecision !== 'all') {
    return response.status(400).render(folder + 'override-scope', {
      pending,
      overrideLabel: overrideTypes[pending.type],
      childLabel: pending.source.type === 'managementCatchment' ? 'operational catchments' : 'water bodies',
      error: 'Select whether to apply the override to all descendants or choose specific descendants.'
    })
  }

  try {
    pending.scope = 'all'
    const targets = await getTargetsForSource(pending.source)
    return prepareOverrideTargets(request, response, targets)
  } catch (error) {
    next(error)
  }
})

router.get(folder + 'override-descendants', async (request, response, next) => {
  const pending = request.session.data.pendingOverride
  if (!pending) {
    return response.redirect(folder + 'manual-overrides-summary')
  }
  try {
    const children = await getCatchmentChildren(pending.source.type, pending.source.name, pending.source.id)
    response.render(folder + 'override-descendants', {
      pending,
      overrideLabel: overrideTypes[pending.type],
      childLabel: pending.source.type === 'managementCatchment' ? 'operational catchments' : 'water bodies',
      children,
      error: request.session.data.overrideSelectionError
    })
    delete request.session.data.overrideSelectionError
  } catch (error) {
    next(error)
  }
})

router.post(folder + 'override-descendants', async (request, response, next) => {
  const pending = request.session.data.pendingOverride
  if (!pending) {
    return response.redirect(folder + 'manual-overrides-summary')
  }
  const selectedIds = [].concat(request.body.descendants || []).map(String)
  if (!selectedIds.length) {
    request.session.data.overrideSelectionError = 'Select at least one descendant.'
    return response.redirect(folder + 'override-descendants')
  }

  try {
    const targets = await getTargetsForSource(pending.source, selectedIds)
    if (!targets.length) {
      request.session.data.overrideSelectionError = 'Select at least one descendant.'
      return response.redirect(folder + 'override-descendants')
    }
    return prepareOverrideTargets(request, response, targets)
  } catch (error) {
    next(error)
  }
})

const prepareOverrideTargets = (request, response, targets) => {
  const data = request.session.data
  const pending = data.pendingOverride
  if (!targets.length) {
    data.overrideTargetError = 'There are no descendants available for this catchment.'
    return response.redirect(folder + 'override-scope')
  }
  const keyedTargets = targets.map(target => ({ ...target, key: getEntityKey(target) }))
  const conflicts = keyedTargets
    .map(target => ({
      ...target,
      conflict: getCurrentConflict(data, pending.type, target)
    }))
    .filter(target => target.conflict)
  data.overrideTargets = keyedTargets
  data.overrideConflicts = conflicts

  if (conflicts.length) {
    return response.redirect(folder + 'override-conflicts')
  }

  saveGlobalOverride(data, keyedTargets, {})
  return response.redirect(folder + 'manual-overrides-summary')
}

router.get(folder + 'override-conflicts', (request, response) => {
  const data = request.session.data
  if (!data.pendingOverride || !data.overrideConflicts) {
    return response.redirect(folder + 'manual-overrides-summary')
  }
  response.render(folder + 'override-conflicts', {
    pending: data.pendingOverride,
    overrideLabel: overrideTypes[data.pendingOverride.type],
    conflicts: data.overrideConflicts.map(conflict => ({
      ...conflict,
      displayValue: getOverrideDisplayValue(data.pendingOverride.type, conflict.conflict.value)
    }))
  })
})

router.post(folder + 'override-conflicts', (request, response) => {
  const data = request.session.data
  if (!data.pendingOverride || !data.overrideTargets || !data.overrideConflicts) {
    return response.redirect(folder + 'manual-overrides-summary')
  }

  const strategy = request.body.conflictStrategy
  if (!['replaceAll', 'keepAll', 'individual'].includes(strategy)) {
    return response.status(400).render(folder + 'override-conflicts', {
      pending: data.pendingOverride,
      overrideLabel: overrideTypes[data.pendingOverride.type],
      conflicts: data.overrideConflicts.map(conflict => ({
        ...conflict,
        displayValue: getOverrideDisplayValue(data.pendingOverride.type, conflict.conflict.value)
      })),
      error: 'Choose how to handle existing overrides.'
    })
  }

  if (strategy === 'individual' && data.overrideConflicts.some((conflict, index) =>
    !['replace', 'keep'].includes(request.body[`conflict-${index}`])
  )) {
    return response.status(400).render(folder + 'override-conflicts', {
      pending: data.pendingOverride,
      overrideLabel: overrideTypes[data.pendingOverride.type],
      conflicts: data.overrideConflicts.map((conflict, index) => ({
        ...conflict,
        displayValue: getOverrideDisplayValue(data.pendingOverride.type, conflict.conflict.value),
        missingChoice: !['replace', 'keep'].includes(request.body[`conflict-${index}`])
      })),
      error: 'Choose whether to replace or keep each existing override.'
    })
  }

  const replaceChoices = {}
  data.overrideConflicts.forEach((conflict, index) => {
    replaceChoices[conflict.key] = strategy === 'replaceAll'
      ? true
      : strategy === 'individual'
        ? request.body[`conflict-${index}`] === 'replace'
        : false
  })
  saveGlobalOverride(data, data.overrideTargets, replaceChoices)
  response.redirect(folder + 'manual-overrides-summary')
})

router.get(folder + 'remove-global', (request, response) => {
  const record = getGlobalOverrides(request.session.data)
    .find(item => item.id === request.session.data.pendingGlobalRemovalId)
  if (!record) {
    return response.redirect(folder + 'manual-overrides-summary')
  }
  response.render(folder + 'remove-global', {
    record,
    overrideLabel: overrideTypes[record.type]
  })
})

router.post(folder + 'remove-global', (request, response) => {
  const data = request.session.data
  const record = getGlobalOverrides(data).find(item => item.id === data.pendingGlobalRemovalId)
  if (!record) {
    return response.redirect(folder + 'manual-overrides-summary')
  }
  if (request.body.removeScope === 'selected') {
    return response.redirect(folder + 'remove-global-descendants')
  }
  if (request.body.removeScope !== 'all') {
    return response.status(400).render(folder + 'remove-global', {
      record,
      overrideLabel: overrideTypes[record.type],
      error: 'Select whether to remove the override from all descendants or choose specific descendants.'
    })
  }
  record.targets.forEach(target => {
    target.applied = false
    target.status = 'removed'
    target.statusDate = getCurrentDate()
    target.statusEmail = data.email || 'Not recorded'
  })
  delete data.pendingGlobalRemovalId
  response.redirect(folder + 'manual-overrides-summary')
})

router.get(folder + 'cancel-global-removal', (request, response) => {
  delete request.session.data.pendingGlobalRemovalId
  delete request.session.data.globalRemovalError
  response.redirect(folder + 'manual-overrides-summary')
})

router.get(folder + 'remove-global-descendants', (request, response) => {
  const data = request.session.data
  const record = getGlobalOverrides(data).find(item => item.id === data.pendingGlobalRemovalId)
  if (!record) {
    return response.redirect(folder + 'manual-overrides-summary')
  }
  const choiceType = record.source.type === 'managementCatchment'
    ? 'operationalCatchment'
    : 'waterbody'
  const children = record.targets.filter(target => {
    if (target.type !== choiceType) {
      return false
    }
    if (target.applied || target.status === 'kept') {
      return true
    }
    return record.source.type === 'managementCatchment' && record.targets.some(descendant =>
      descendant.type === 'waterbody' &&
      descendant.operationalCatchmentId === target.id &&
      (descendant.applied || descendant.status === 'kept')
    )
  })
  response.render(folder + 'remove-global-descendants', {
    record,
    overrideLabel: overrideTypes[record.type],
    children,
    childLabel: choiceType === 'operationalCatchment' ? 'operational catchments' : 'water bodies',
    error: data.globalRemovalError
  })
  delete data.globalRemovalError
})

router.post(folder + 'remove-global-descendants', (request, response) => {
  const data = request.session.data
  const record = getGlobalOverrides(data).find(item => item.id === data.pendingGlobalRemovalId)
  if (!record) {
    return response.redirect(folder + 'manual-overrides-summary')
  }
  const selectedIds = [].concat(request.body.descendants || []).map(String)
  if (!selectedIds.length) {
    data.globalRemovalError = 'Select at least one descendant.'
    return response.redirect(folder + 'remove-global-descendants')
  }

  const removableTargetType = record.source.type === 'managementCatchment'
    ? 'operationalCatchment'
    : 'waterbody'
  record.targets.forEach(target => {
    const selected = (target.type === removableTargetType && selectedIds.includes(String(target.id))) ||
      (record.source.type === 'managementCatchment' &&
        target.type === 'waterbody' &&
        selectedIds.includes(String(target.operationalCatchmentId)))
    if (selected && (target.applied || target.status === 'kept')) {
      target.applied = false
      target.status = 'removed'
      target.statusDate = getCurrentDate()
      target.statusEmail = data.email || 'Not recorded'
    }
  })
  delete data.pendingGlobalRemovalId
  response.redirect(folder + 'manual-overrides-summary')
})

module.exports = router