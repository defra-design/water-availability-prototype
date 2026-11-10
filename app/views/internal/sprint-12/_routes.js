const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const folder = '/internal/sprint-12/'
const templateFolder = '/internal/sprint-12/'
const getCurrentDate = () => new Date().toLocaleDateString('en-GB')
const wrgisComponents = ['hmwb', 'crt', 'lde', 'idb', 'thamesBespokeStrategy', 'greenLinePolicy']
const manualActivationComponents = [...wrgisComponents, 'assessmentPoint']
const wrgisComponentLabels = {
  hmwb: 'HMWB',
  crt: 'CRT',
  lde: 'LDE',
  idb: 'IDB',
  thamesBespokeStrategy: 'Thames bespoke strategy',
  greenLinePolicy: 'Green-line Policy',
  assessmentPoint: 'Assessment point'
}
const defaultWrgisConfig = {
  hmwb: 'yes',
  crt: 'yes',
  lde: 'yes',
  idb: 'yes',
  thamesBespokeStrategy: 'no',
  greenLinePolicy: 'no'
}
const getWrgisConfig = data => {
  data.wrgisConfig = data.wrgisConfig || {}
  wrgisComponents.forEach(component => {
    if (data.wrgisConfig[component] === undefined) {
      data.wrgisConfig[component] = defaultWrgisConfig[component]
    }
  })
  return data.wrgisConfig
}
const overrideTypes = {
  updateCol: 'Water availability colour',
  updateHof: 'Hands-off Flow',
  hmwbImplications: 'HMWB implications',
  hmwbUniqueContent: 'HMWB unique content',
  idb: 'IDB implications',
  crt: 'CRT implications',
  lde: 'LDE implications',
  thamesBespokeStrategy: 'Thames bespoke strategy implications',
  greenLinePolicy: 'Green-line Policy implications'
}
const hmwbOverrideTypes = ['hmwbImplications', 'hmwbUniqueContent']
const policyFamilies = {
  idb: { acronym: 'IDB', name: 'internal drainage board' },
  crt: { acronym: 'CRT', name: 'Canals and Rivers Trust' },
  lde: { acronym: 'LDE', name: 'level dependent environment' },
  thamesBespokeStrategy: { acronym: 'Thames bespoke strategy', name: 'Thames bespoke strategy' },
  greenLinePolicy: { acronym: 'Green-line Policy', name: 'Green-line Policy' }
}
const policyContentTypes = Object.keys(policyFamilies).flatMap(policy => [
  `${policy}Implications`,
  `${policy}UniqueContent`
])
const localPolicyTypes = [
  ...hmwbOverrideTypes,
  ...policyContentTypes
]
const localPolicyImplicationKeys = [
  'hmwbServiceInformation',
  'crtImplications',
  'idbImplications',
  'ldeImplications',
  'thamesBespokeStrategyImplications',
  'greenLinePolicyImplications'
]
const getPolicyImplicationLines = value => {
  const values = Array.isArray(value) ? value : [value]
  return values
    .flatMap(item => String(item || '').split(/\r?\n/))
    .map(item => item.trim())
    .filter(Boolean)
}
const getStackedPolicyImplicationLines = (...values) => {
  const seen = new Set()
  return values.flatMap(getPolicyImplicationLines).filter(line => {
    if (seen.has(line)) {
      return false
    }
    seen.add(line)
    return true
  })
}
const getPolicyInputItems = value => {
  return getPolicyImplicationLines(value)
    .slice(0, 10)
}
const getPolicyContentItems = (type, value) => {
  const config = localPolicyFields[type]
  if (config?.isImplications) {
    return getPolicyInputItems(value)
  }
  const content = String(value || '').trim()
  return content ? [content] : []
}
const getRemovablePolicyValue = (type, effective) =>
  isLocalPolicyImplication(type)
    ? effective.source === 'local' ? getLocallyOwnedPolicyValue(effective) : ''
    : effective.source === 'none' ? '' : effective.value
const localPolicyFields = {
  hmwbImplications: {
    title: 'HMWB implications',
    applicationLabel: 'HMWB implication',
    actionLabel: 'implications',
    contentLabel: 'Implications',
    notesLabel: 'Implication notes',
    contentKey: 'hmwbServiceInformation',
    notesKey: 'hmwbTeamNotes',
    savedKey: 'hmwbServiceInformationSaved',
    route: 'update-hmwb',
    contentField: 'moreDetail',
    isImplications: true,
    notesField: 'teamNotes'
  },
  hmwbUniqueContent: {
    title: 'HMWB unique content',
    applicationLabel: 'unique content',
    contentLabel: 'Unique content',
    notesLabel: 'Unique content notes',
    contentKey: 'hmwbUniqueContent',
    notesKey: 'hmwbUniqueContentNotes',
    savedKey: 'hmwbUniqueContentSaved',
    route: 'update-hmwb-unique-content',
    contentField: 'uniqueContent',
    notesField: 'uniqueContentNotes'
  },
}
Object.entries(policyFamilies).forEach(([policy, family]) => {
  const prefix = family.acronym
  localPolicyFields[`${policy}Implications`] = {
    title: `${prefix} implications`,
    applicationLabel: `${prefix} implication`,
    actionLabel: 'implications',
    contentLabel: 'Implications',
    notesLabel: 'Implication notes',
    contentKey: `${policy}Implications`,
    notesKey: `${policy}ImplicationNotes`,
    savedKey: `${policy}ImplicationsSaved`,
    route: `update-policy/${policy}Implications`,
    heading: `Edit ${prefix} implications`,
    hint: `Explain clearly to the end user what implications apply to this ${family.name}.`,
    contentField: 'content',
    isImplications: true,
    notesField: 'notes'
  }
  overrideTypes[`${policy}Implications`] = `${prefix} implications`
  localPolicyFields[`${policy}UniqueContent`] = {
    title: `${prefix} unique content`,
    applicationLabel: `${prefix} unique content`,
    actionLabel: 'unique content',
    contentLabel: 'Unique content',
    notesLabel: 'Unique content notes',
    contentKey: `${policy}UniqueContent`,
    notesKey: `${policy}UniqueContentNotes`,
    savedKey: `${policy}UniqueContentSaved`,
    route: `update-policy/${policy}UniqueContent`,
    heading: `Edit ${prefix} unique content`,
    hint: `Provide any contextual unique content to the end user about this ${family.name}.`,
    contentField: 'content',
    notesField: 'notes'
  }
  overrideTypes[`${policy}UniqueContent`] = `${prefix} unique content`
})

const localPolicyImplicationTypes = Object.keys(localPolicyFields)
  .filter(type => localPolicyFields[type].isImplications)
const isUniqueLocalPolicyContent = type =>
  localPolicyTypes.includes(type) && !localPolicyImplicationTypes.includes(type)
const isLocalPolicyImplication = type => localPolicyImplicationTypes.includes(type)

router.use((request, response, next) => {
 const requestPath = request.baseUrl + request.path
 if (requestPath.startsWith(folder)) {
  localPolicyImplicationKeys.forEach(key => {
   const items = getPolicyInputItems(request.session.data[key])
   request.session.data[`${key}Items`] = items
   response.locals.data[`${key}Items`] = items
 })
  response.locals.internalCurrent = true
 response.locals.internalFolder = folder.slice(0, -1)
 response.locals.externalFolder = folder.replace('/internal/', '/external/').slice(0, -1)
 response.locals.internalStartPage = requestPath === folder + 'start'
  response.locals.internalSignedInEmail = request.session.data.email || ''
 }
 next()
})

router.get('/sign-out', (request, response) => {
 request.session.data.email = ''
 response.redirect(folder + 'start')
})

router.get(folder + 'confirm-wrgis-switch-off', (request, response) => {
  const data = request.session.data
  const component = data.pendingWrgisSwitchOff
  const entity = data.currentOverrideEntity || getCurrentEntity(data)
  const state = manualActivationComponents.includes(component)
    ? getWrgisEffectiveState(data, component, entity)
    : null
  if (!manualActivationComponents.includes(component) ||
    (wrgisComponents.includes(component) && getWrgisConfig(request.session.data)[component] !== 'no') ||
    !state?.active ||
    !state.local) {
    delete data.pendingWrgisSwitchOff
    return response.redirect(folder + 'manual-overrides-summary')
  }
  const descendants = getWrgisDescendantEntities(data, entity)
  const children = entity.type === 'managementCatchment'
    ? (data.hierarchyChildren || []).map(child => ({
        ...child,
        key: getEntityKey({
          type: 'operationalCatchment',
          id: child.id,
          name: child.name,
          managementCatchmentId: entity.id,
          managementCatchment: entity.name
        }),
        waterbodyCount: (child.waterbodies || []).length
      }))
    : entity.type === 'operationalCatchment'
      ? (data.hierarchyChildren || []).map(child => ({
          ...child,
          key: getEntityKey({ type: 'waterbody', id: child.id, name: child.name })
        }))
      : []
  response.render(templateFolder + 'confirm-wrgis-switch-off', {
    component: wrgisComponentLabels[component],
    isAssessmentPoint: component === 'assessmentPoint',
    hasDescendants: descendants.length > 0,
    children,
    childLabel: entity.type === 'managementCatchment' ? 'operational catchments' : 'water bodies',
    error: data.wrgisSwitchOffError || ''
  })
  delete data.wrgisSwitchOffError
})

router.post(folder + 'confirm-wrgis-switch-off', (request, response) => {
  const data = request.session.data
  const component = data.pendingWrgisSwitchOff
  const entity = data.currentOverrideEntity || getCurrentEntity(data)
  const currentState = manualActivationComponents.includes(component)
    ? getWrgisEffectiveState(data, component, entity)
    : null
  if (!manualActivationComponents.includes(component) ||
    (wrgisComponents.includes(component) && getWrgisConfig(data)[component] !== 'no') ||
    !currentState?.active ||
    !currentState.local) {
    delete data.pendingWrgisSwitchOff
    return response.redirect(folder + 'manual-overrides-summary')
  }

  const descendants = data.hierarchyChildren || []
  const selectableChildren = entity.type === 'managementCatchment'
    ? descendants.map(child => ({
        ...child,
        key: getEntityKey({
          type: 'operationalCatchment',
          id: child.id,
          name: child.name,
          managementCatchmentId: entity.id,
          managementCatchment: entity.name
        })
      }))
    : entity.type === 'operationalCatchment'
      ? descendants.map(child => ({
          ...child,
          key: getEntityKey({ type: 'waterbody', id: child.id, name: child.name })
        }))
      : []
  const hasDescendants = selectableChildren.length > 0
  const selectedIds = request.body.descendants
    ? Array.isArray(request.body.descendants) ? request.body.descendants : [request.body.descendants]
    : []
  const scope = request.body.scope
  if (hasDescendants && scope !== 'all' && scope !== 'selected') {
    data.wrgisSwitchOffError = 'Choose whether to switch it off for all descendants or select descendants.'
    return response.redirect(folder + 'confirm-wrgis-switch-off')
  }
  if (scope === 'selected' &&
    (!selectedIds.length || selectedIds.some(id => !selectableChildren.some(child => String(child.id) === String(id))))) {
    data.wrgisSwitchOffError = 'Select one or more descendants.'
    return response.redirect(folder + 'confirm-wrgis-switch-off')
  }

  const onRecords = getWrgisStateRecords(data, 'on')
  const offRecords = getWrgisStateRecords(data, 'off')
  onRecords[component] = onRecords[component] || {}
  offRecords[component] = offRecords[component] || {}
  const today = getCurrentDate()
  const targets = scope === 'all'
    ? selectableChildren
    : scope === 'selected'
      ? selectableChildren.filter(child => selectedIds.some(id => String(id) === String(child.id)))
      : []
  const descendantsToDisable = targets.flatMap(child => {
      if (entity.type === 'managementCatchment') {
        const operationalEntity = {
          type: 'operationalCatchment',
          id: child.id,
          name: child.name,
          managementCatchmentId: entity.id,
          managementCatchment: entity.name
        }
        return [
          operationalEntity,
          ...(child.waterbodies || []).map(waterbody => ({
            type: 'waterbody',
            id: waterbody.id,
            name: waterbody.name,
            operationalCatchmentId: operationalEntity.id,
            operationalCatchment: operationalEntity.name,
            managementCatchmentId: entity.id,
            managementCatchment: entity.name
          }))
        ]
      }
      return [{
        type: 'waterbody',
        id: child.id,
        name: child.name,
        operationalCatchmentId: entity.id,
        operationalCatchment: entity.name,
        managementCatchmentId: entity.managementCatchmentId,
        managementCatchment: entity.managementCatchment
      }]
  })
  const entitiesToDisable = [entity, ...descendantsToDisable]
  entitiesToDisable.forEach(target => {
    const key = getEntityKey(target)
    if (component === 'assessmentPoint') {
      const currentRecord = onRecords[component][key]
      if (currentRecord) {
        addAssessmentPointHistory(data, target, 'removed', currentRecord, today)
      }
    }
    delete onRecords[component][key]
    offRecords[component][key] = { date: today }
    if (component !== 'assessmentPoint') {
      removeWrgisLocalContent(data, component, target)
    }
  })
  delete data.pendingWrgisSwitchOff
  response.redirect(folder + 'manual-overrides-summary')
})

router.get(folder + 'configurator', (request, response) => {
  const wrgisConfig = getWrgisConfig(request.session.data)
  response.render(templateFolder + 'configurator', {
    wrgisConfig,
    wrgisComponents: wrgisComponents.map(key => ({ key, label: wrgisComponentLabels[key] })),
    errors: {}
  })
})

router.post(folder + 'configurator', (request, response) => {
  const wrgisConfig = { ...defaultWrgisConfig }
  const errors = {}
  wrgisComponents.forEach(component => {
    const answer = request.body[`wrgis-${component}`]
    if (answer !== 'yes' && answer !== 'no') {
      errors[component] = `Select yes or no for ${wrgisComponentLabels[component]}`
    } else {
      wrgisConfig[component] = answer
    }
  })

  if (Object.keys(errors).length) {
    response.status(400).render(templateFolder + 'configurator', {
      wrgisConfig,
      wrgisComponents: wrgisComponents.map(key => ({ key, label: wrgisComponentLabels[key] })),
      errors
    })
    return
  }

  request.session.data.wrgisConfig = wrgisConfig
  const manualActivation = request.session.data.wrgisManualActivation || {}
  const manualDeactivation = request.session.data.wrgisManualDeactivation || {}
  wrgisComponents.forEach(component => {
    if (wrgisConfig[component] === 'yes') {
      delete manualActivation[component]
      delete manualDeactivation[component]
    }
  })
  request.session.data.wrgisManualActivation = manualActivation
  request.session.data.wrgisManualDeactivation = manualDeactivation
  request.session.data.wrgisConfigured = true
  response.redirect(folder + 'start')
})

router.get(folder + 'start', (request, response) => {
  if (!request.session.data.wrgisConfigured) {
    response.redirect(folder + 'configurator')
    return
  }
  response.render(templateFolder + 'start')
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
    return {
      type,
      id: data.waterBodyId,
      name: data.waterBodyName,
      operationalCatchmentId: data.operationalCatchmentId,
      operationalCatchment: data.operationalCatchment,
      managementCatchmentId: data.managementCatchmentId,
      managementCatchment: data.managementCatchment
    }
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

const getWrgisStateRecords = (data, state) => {
  const key = state === 'on' ? 'wrgisManualActivation' : 'wrgisManualDeactivation'
  data[key] = data[key] || {}
  return data[key]
}

const getWrgisEntityChain = (data, entity) => {
  const chain = []
  if (entity.type === 'managementCatchment') {
    chain.push(entity)
  } else {
    if (entity.managementCatchmentId || entity.managementCatchment) {
      chain.push({
        type: 'managementCatchment',
        id: entity.managementCatchmentId,
        name: entity.managementCatchment
      })
    }
    if (entity.type === 'operationalCatchment') {
      chain.push(entity)
    } else if (entity.type === 'waterbody') {
      if (entity.operationalCatchmentId || entity.operationalCatchment) {
        chain.push({
          type: 'operationalCatchment',
          id: entity.operationalCatchmentId,
          name: entity.operationalCatchment,
          managementCatchmentId: entity.managementCatchmentId,
          managementCatchment: entity.managementCatchment
        })
      }
      chain.push(entity)
    }
  }
  return chain.filter((item, index) =>
    chain.findIndex(candidate => getEntityKey(candidate) === getEntityKey(item)) === index
  )
}

const normalizeWrgisManualStates = (data, currentEntity) => {
  ;['on', 'off'].forEach(state => {
    const records = getWrgisStateRecords(data, state)
    manualActivationComponents.forEach(component => {
      const componentRecords = records[component]
      if (componentRecords && componentRecords.date) {
        const chain = getWrgisEntityChain(data, currentEntity)
        const migrationTarget = chain.find(entity => entity.type === 'managementCatchment') || currentEntity
        records[component] = {
          [getEntityKey(migrationTarget)]: componentRecords
        }
      }
    })
  })
}

const getWrgisEffectiveState = (data, component, entity) => {
  const onRecords = getWrgisStateRecords(data, 'on')[component] || {}
  const offRecords = getWrgisStateRecords(data, 'off')[component] || {}
  const chain = getWrgisEntityChain(data, entity)
  for (let index = chain.length - 1; index >= 0; index -= 1) {
    const key = getEntityKey(chain[index])
    if (onRecords[key]) {
      return {
        active: true,
        date: onRecords[key].date,
        notes: onRecords[key].notes || '',
        source: chain[index],
        local: index === chain.length - 1
      }
    }
    if (offRecords[key]) {
      return {
        active: false,
        date: offRecords[key].date,
        source: chain[index],
        local: index === chain.length - 1
      }
    }
  }
  return {
    active: component === 'assessmentPoint' ? false : getWrgisConfig(data)[component] === 'yes',
    automatic: component !== 'assessmentPoint'
  }
}

const getWrgisDescendantEntities = (data, entity) => {
  const children = data.hierarchyChildren || []
  const operationalCatchments = entity.type === 'managementCatchment'
    ? children
    : entity.type === 'operationalCatchment'
      ? [{ ...entity, waterbodies: children }]
      : []
  return operationalCatchments.flatMap(operationalCatchment => {
    const operationalEntity = {
      type: 'operationalCatchment',
      id: operationalCatchment.id || entity.operationalCatchmentId,
      name: operationalCatchment.name || entity.operationalCatchment,
      managementCatchmentId: entity.type === 'managementCatchment'
        ? entity.id
        : entity.managementCatchmentId,
      managementCatchment: entity.type === 'managementCatchment'
        ? entity.name
        : entity.managementCatchment
    }
    const waterbodies = operationalCatchment.waterbodies || []
    return [
      operationalEntity,
      ...waterbodies.map(waterbody => ({
        type: 'waterbody',
        id: waterbody.id,
        name: waterbody.name,
        operationalCatchmentId: operationalEntity.id,
        operationalCatchment: operationalEntity.name,
        managementCatchmentId: operationalEntity.managementCatchmentId,
        managementCatchment: operationalEntity.managementCatchment
      }))
    ]
  })
}

const getLocalOverrides = data => data.localOverrides || (data.localOverrides = {})
const getGlobalOverrides = data => data.globalOverrides || (data.globalOverrides = [])
const getOverrideHistory = data => data.overrideHistory || (data.overrideHistory = {})

const legacyPolicyTypes = {
  idb: 'idbImplications',
  crt: 'crtImplications',
  lde: 'ldeImplications',
  thamesBespokeStrategy: 'thamesBespokeStrategyImplications',
  greenLinePolicy: 'greenLinePolicyImplications'
}

const migrateLegacyPolicyContent = data => {
  Object.values(getLocalOverrides(data)).forEach(entityOverrides => {
    Object.entries(legacyPolicyTypes).forEach(([legacyType, currentType]) => {
      const legacyValue = entityOverrides[legacyType]
      if (!legacyValue) {
        return
      }
      const currentValue = entityOverrides[currentType]
      if (!currentValue ||
        Number(legacyValue.createdAt || 0) > Number(currentValue.createdAt || 0)) {
        entityOverrides[currentType] = legacyValue
      }
      delete entityOverrides[legacyType]
    })
  })

  getGlobalOverrides(data).forEach(record => {
    if (legacyPolicyTypes[record.type]) {
      record.type = legacyPolicyTypes[record.type]
    }
  })

  Object.values(getOverrideHistory(data)).forEach(entityHistory => {
    Object.entries(legacyPolicyTypes).forEach(([legacyType, currentType]) => {
      if (entityHistory[legacyType]) {
        entityHistory[currentType] = (entityHistory[currentType] || []).concat(entityHistory[legacyType])
        delete entityHistory[legacyType]
      }
    })
  })

  if (data.pendingOverride && legacyPolicyTypes[data.pendingOverride.type]) {
    data.pendingOverride.type = legacyPolicyTypes[data.pendingOverride.type]
  }

}

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

const addAssessmentPointHistory = (data, entity, action, record, date = getCurrentDate()) => {
  const entityKey = getEntityKey(entity)
  data.assessmentPointHistory = data.assessmentPointHistory || {}
  data.assessmentPointHistory[entityKey] = data.assessmentPointHistory[entityKey] || []
  data.assessmentPointHistory[entityKey].push({
    action,
    date,
    notes: record.notes || '',
    entity,
    email: data.email || 'Not recorded',
    createdAt: Date.now()
  })
}

const removeWrgisLocalContent = (data, component, entity = data.currentOverrideEntity || getCurrentEntity(data)) => {
  const entityKey = getEntityKey(entity)
  const localOverrides = getLocalOverrides(data)
  const types = component === 'hmwb'
    ? hmwbOverrideTypes
    : [`${component}Implications`, `${component}UniqueContent`]

  types.forEach(type => {
    const localOverride = localOverrides[entityKey] && localOverrides[entityKey][type]
    if (localOverride) {
      addLocalOverrideHistory(data, entity, type, 'removed', localOverride, localOverride.value)
      delete localOverrides[entityKey][type]
    }

    const config = localPolicyFields[type]
    if (config) {
      data[config.contentKey] = ''
      data[config.notesKey] = ''
      data[config.savedKey] = false
    }
  })
}

const getGlobalForEntity = (data, type, entity) => {
  const key = getEntityKey(entity)
  return getGlobalOverrides(data)
    .flatMap(record => (record.type === type ? record.targets || [] : [])
      .filter(target => target.key === key && target.applied)
      .map(target => ({ record, target })))
    .reduce((latest, candidate) =>
      !latest || Number(candidate.record.createdAt || 0) >= Number(latest.record.createdAt || 0)
        ? candidate
        : latest,
    null)
}

const getEffectiveOverride = (data, type, entity) => {
  const local = getLocalOverrides(data)[getEntityKey(entity)]
  let inherited = getGlobalForEntity(data, type, entity)
  const localOverride = local && local[type]
  if (entity.type === 'operationalCatchment' &&
    isLocalPolicyImplication(type) &&
    localOverride?.stackInherited &&
    !inherited &&
    localOverride.inheritedSourceRecordId) {
    const sourceRecord = getGlobalOverrides(data).find(record =>
      record.id === localOverride.inheritedSourceRecordId &&
      record.type === type
    )
    const sourceTarget = sourceRecord?.targets.find(target =>
      target.key === getEntityKey(entity) &&
      target.status === 'superseded' &&
      target.supersededBy
    )
    const supersedingRecord = sourceTarget && getGlobalOverrides(data).find(record =>
      record.id === sourceTarget.supersededBy &&
      record.type === type &&
      record.source.type === 'operationalCatchment' &&
      getEntityKey(record.source) === getEntityKey(entity)
    )
    if (sourceTarget && supersedingRecord) {
      sourceTarget.applied = true
      sourceTarget.status = 'applied'
      delete sourceTarget.supersededBy
      inherited = { record: sourceRecord, target: sourceTarget }
    }
  }
  const inheritedValue = inherited
    ? inherited.target.stackedValues
      ? getStackedPolicyImplicationLines(inherited.target.stackedValues).join('\n')
      : inherited.record.value
    : ''
  if (entity.type === 'operationalCatchment' &&
    isLocalPolicyImplication(type) &&
    local?.[type] &&
    !local[type].stackInherited &&
    inherited) {
    const inheritedLines = getPolicyImplicationLines(inheritedValue)
    const localLines = getPolicyImplicationLines(local[type].value)
    const sourceKey = getEntityKey(entity)
    const previousOperationalApplication = getGlobalOverrides(data)
      .filter(record =>
        record.type === type &&
        getEntityKey(record.source) === sourceKey &&
        record.targets.some(target =>
          target.applied || target.status === 'stacked' || target.status === 'kept'
        )
      )
      .sort((first, second) => Number(second.createdAt || 0) - Number(first.createdAt || 0))
      .find(record => {
        const sourceLines = getPolicyImplicationLines(record.value)
        const expectedLines = [...inheritedLines, ...sourceLines]
        return expectedLines.length === localLines.length &&
          expectedLines.every((line, index) => line === localLines[index])
      })
    if (previousOperationalApplication) {
      local[type].value = previousOperationalApplication.value
      local[type].stackInherited = true
      local[type].inheritedSourceRecordId = inherited.record.id
    }
  }
  const hasLocal = local && local[type] && local[type].value !== 'No override set'
  const localIsNewer = hasLocal &&
    (local[type].stackInherited && isLocalPolicyImplication(type) ||
      !inherited ||
      Number(local[type].createdAt || 0) >= Number(inherited.record.createdAt || 0))

  if (localIsNewer) {
    const stackInherited = isLocalPolicyImplication(type) && local[type].stackInherited
    return {
      ...local[type],
      value: stackInherited
        ? getStackedPolicyImplicationLines(inheritedValue, local[type].value).join('\n')
        : local[type].value,
      localValue: local[type].value,
      inheritedValue: stackInherited ? inheritedValue : '',
      inheritedSourceRecordId: stackInherited ? inherited?.record.id : undefined,
      inheritedSourceEntity: stackInherited ? inherited?.record.source : undefined,
      source: 'local',
      sourceEntity: entity
    }
  }

  if (inherited) {
    return {
      value: inheritedValue,
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

const getInheritedPolicySources = (data, type, entity) => {
  const parents = entity.type === 'waterbody'
    ? [
        {
          type: 'operationalCatchment',
          id: entity.operationalCatchmentId,
          name: entity.operationalCatchment
        },
        {
          type: 'managementCatchment',
          id: entity.managementCatchmentId,
          name: entity.managementCatchment
        }
      ]
    : entity.type === 'operationalCatchment'
      ? [{
          type: 'managementCatchment',
          id: entity.managementCatchmentId,
          name: entity.managementCatchment
        }]
      : []
  const currentKey = getEntityKey(entity)
  const sourcesByKey = new Map()

  parents
    .filter(parent => parent.id || parent.name)
    .forEach(parent => {
      const parentKey = getEntityKey(parent)
      const records = getGlobalOverrides(data)
        .filter(record =>
          record.type === type &&
          getEntityKey(record.source) === parentKey
        )
        .filter(record => record.targets.some(target =>
          target.key === currentKey &&
          target.applied &&
          (target.status === 'applied' || target.status === 'stacked')
        ))
        .sort((first, second) =>
          Number(second.createdAt || 0) - Number(first.createdAt || 0)
        )
      const record = records[0]
      if (record) {
        sourcesByKey.set(parentKey, {
          sourceEntity: record.source,
          sourceUrl: makeSummaryUrl(record.source),
          date: record.date
        })
        return
      }

      const localOverride = getLocalOverrides(data)[parentKey]?.[type]
      if (localOverride && getPolicyImplicationLines(localOverride.value).length) {
        sourcesByKey.set(parentKey, {
          sourceEntity: parent,
          sourceUrl: makeSummaryUrl(parent),
          date: localOverride.date
        })
      }
    })

  return Array.from(sourcesByKey.values())
}

const getLocallyOwnedPolicyValue = effective =>
  effective.localValue === undefined ? effective.value : effective.localValue

const isGlobalOverrideEffective = (data, record, target) => {
  const effective = getEffectiveOverride(data, record.type, target)
  return (effective.source === 'global' && effective.sourceRecordId === record.id) ||
    (effective.source === 'local' &&
      effective.stackInherited &&
      effective.inheritedSourceRecordId === record.id)
}

const getGlobalTargetStatus = (data, record, target) => {
  if (target.status === 'kept') {
    return localPolicyTypes.includes(record.type) ? 'Existing value kept' : 'Existing override kept'
  }
  if (isGlobalOverrideEffective(data, record, target)) {
    return localPolicyTypes.includes(record.type) ? 'Application applied' : 'Override applied'
  }
  const effective = getEffectiveOverride(data, record.type, target)
  if (effective.source === 'local') {
    return localPolicyTypes.includes(record.type) ? 'Superseded by a local application' : 'Superseded by a local override'
  }
  if (effective.source === 'global') {
    return localPolicyTypes.includes(record.type) ? 'Superseded by a later application' : 'Superseded by a later override'
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
  const contentLabel = isLocalPolicyImplication(type) ? 'implication' : 'override'
  if (effective.source === 'local') {
    return { value: effective.value, source: `Local ${contentLabel}` }
  }
  if (effective.source === 'global') {
    return {
      value: effective.value,
      source: `Global ${contentLabel} from ${effective.sourceEntity.name}`
    }
  }

  return null
}

const getGlobalPolicyEditRecord = (data, type, entity) => {
  const recordId = data.pendingGlobalPolicyEditId
  if (!recordId || !isLocalPolicyImplication(type)) {
    return null
  }
  const record = getGlobalOverrides(data).find(item =>
    item.id === recordId &&
    item.type === type &&
    getEntityKey(item.source) === getEntityKey(entity)
  )
  return record || null
}

const updateGlobalPolicyContent = (data, record, value, notes) => {
  const normalizedValue = getPolicyInputItems(value).join('\n')
  const date = getCurrentDate()
  const createdAt = Date.now()
  const previousValue = record.value

  if (!record.original) {
    record.original = {
      value: record.value,
      notes: record.notes,
      date: record.date,
      action: record.action || 'applied',
      createdAt: record.createdAt || 0
    }
  }
  record.editHistory = record.editHistory || []
  record.editHistory.push({
    action: 'edited',
    value: normalizedValue,
    previousValue,
    date,
    notes,
    email: data.email || 'Not recorded',
    createdAt
  })
  record.value = normalizedValue
  record.notes = notes
  record.date = date
  record.action = 'edited'
  if (record.source.type === 'operationalCatchment') {
    const sourceKey = getEntityKey(record.source)
    const localOverrides = getLocalOverrides(data)
    localOverrides[sourceKey] = localOverrides[sourceKey] || {}
    const localOverride = localOverrides[sourceKey][record.type]
    if (localOverride) {
      localOverride.value = normalizedValue
      localOverride.notes = notes
      localOverride.date = date
      localOverride.createdAt = createdAt
    }
  }
  record.targets.forEach(target => {
    if (target.status === 'stacked') {
      target.stackedValues = [
        ...getPolicyImplicationLines(target.previousValue),
        ...getPolicyImplicationLines(normalizedValue)
      ]
    }
  })
  if (record.source.type === 'managementCatchment') {
    const operationalRecords = getGlobalOverrides(data).filter(candidate =>
      candidate !== record &&
      candidate.type === record.type &&
      candidate.source.type === 'operationalCatchment' &&
      ((candidate.source.managementCatchmentId && record.source.id &&
        String(candidate.source.managementCatchmentId) === String(record.source.id)) ||
        candidate.source.managementCatchment === record.source.name)
    )
    record.targets
      .filter(target => target.type === 'waterbody' && (target.applied || target.status === 'stacked'))
      .forEach(parentTarget => {
        const inheritedValue = parentTarget.stackedValues
          ? parentTarget.stackedValues.join('\n')
          : normalizedValue
        operationalRecords.forEach(operationalRecord => {
          operationalRecord.targets
            .filter(target =>
              target.key === parentTarget.key &&
              target.applied &&
              target.status === 'stacked'
            )
            .forEach(target => {
              target.previousValue = inheritedValue
              target.stackedValues = [
                ...getPolicyImplicationLines(inheritedValue),
                ...getPolicyImplicationLines(operationalRecord.value)
              ]
            })
        })
      })
  }
  delete data.pendingGlobalPolicyEditId
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
  return `${folder}manual-overrides-summary?${params.toString()}`
}

const saveGlobalOverride = (data, targets, replaceChoices) => {
  const pending = data.pendingOverride
  const stackedInheritedRecordId = pending.stackInherited
    ? pending.stackInheritedSourceRecordId || pending.inheritedSourceRecordId
    : undefined
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: pending.type,
    action: pending.action || 'applied',
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
      const choice = replaceChoices[key]
      const replace = isUniqueLocalPolicyContent(pending.type)
        ? true
        : conflict
          ? (choice === 'replace' || choice === true)
          : true
      const stack = isLocalPolicyImplication(pending.type) &&
        conflict &&
        (choice === 'stack' || choice === 'append')
      const stackedValues = stack
        ? getStackedPolicyImplicationLines(previousOverride.value, pending.value)
        : undefined
      return {
        ...target,
        key,
        applied: replace || stack,
        status: stack ? 'stacked' : replace ? 'applied' : (conflict ? 'kept' : 'not applied'),
        stackedValues,
        previousValue: (replace || stack) && previousOverride.source !== 'none'
          ? previousOverride.value
          : undefined
      }
    })
  }
  const shouldApplyAtOperationalSource = pending.source.type === 'operationalCatchment' &&
    (!isUniqueLocalPolicyContent(pending.type) ||
      !pending.inheritedSourceRecordId ||
      pending.replaceInherited)
  if (shouldApplyAtOperationalSource) {
    const sourceKey = getEntityKey(pending.source)
    const previousOverride = getEffectiveOverride(data, pending.type, pending.source)
    const localOverrides = getLocalOverrides(data)
    localOverrides[sourceKey] = localOverrides[sourceKey] || {}
    localOverrides[sourceKey][pending.type] = {
      value: pending.value,
      notes: pending.notes,
      date: pending.date,
      createdAt: Date.now(),
      stackInherited: Boolean(pending.stackInherited && isLocalPolicyImplication(pending.type)),
      inheritedSourceRecordId: pending.stackInherited
        ? pending.stackInheritedSourceRecordId || pending.inheritedSourceRecordId
        : undefined
    }
    addLocalOverrideHistory(
      data,
      pending.source,
      pending.type,
      pending.action || 'applied',
      localOverrides[sourceKey][pending.type],
      previousOverride.value
    )
    if (pending.removedItems && pending.removedItems.length) {
      addLocalOverrideHistory(
        data,
        pending.source,
        pending.type,
        'removed',
        { value: pending.removedItems.join('\n'), notes: pending.notes },
        pending.previousValue
      )
    }
    getGlobalOverrides(data)
      .filter(previous => previous.type === pending.type)
      .forEach(previous => {
        if (previous.id === stackedInheritedRecordId) {
          return
        }
        const previousTarget = previous.targets.find(target =>
          target.key === sourceKey && (target.applied || target.status === 'kept')
        )
        if (previousTarget) {
          previousTarget.applied = false
          previousTarget.status = 'superseded'
          previousTarget.supersededBy = record.id
          previousTarget.statusDate = getCurrentDate()
          previousTarget.statusEmail = data.email || 'Not recorded'
        }
      })
  }
  record.targets.forEach(target => {
    if (!target.applied || target.status === 'stacked') {
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
  if (pending.removedItems && pending.removedItems.length) {
    record.targets.filter(target => target.applied).forEach(target => {
      addLocalOverrideHistory(
        data,
        target,
        pending.type,
        'removed',
        { value: pending.removedItems.join('\n'), notes: pending.notes },
        pending.previousValue
      )
    })
  }
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
//const currentRoutes = require('./views/internal/sprint-12/_routes')
//router.use('/', currentRoutes)

router.get(folder + 'manual-overrides-summary', async function (request, response, next) {
  const wrgisConfig = getWrgisConfig(request.session.data)
  request.session.data.wrgisManualActivation =
    request.session.data.wrgisManualActivation || {}
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
  normalizeWrgisManualStates(request.session.data, currentEntity)
	const entityKey = getEntityKey(currentEntity)
  migrateLegacyPolicyContent(request.session.data)
	const localOverrides = getLocalOverrides(request.session.data)
	localOverrides[entityKey] = localOverrides[entityKey] || {}
  const hmwbSessionContentEntityKey = request.session.data.hmwbSessionContentEntityKey
  const hmwbSessionContentBelongsToCurrentEntity = !hmwbSessionContentEntityKey ||
    hmwbSessionContentEntityKey === entityKey
	if (hmwbSessionContentBelongsToCurrentEntity &&
    request.session.data.hmwbServiceInformationSaved &&
    request.session.data.hmwbServiceInformation &&
	  !localOverrides[entityKey].hmwbImplications) {
	  localOverrides[entityKey].hmwbImplications = {
	    value: request.session.data.hmwbServiceInformation,
	    notes: request.session.data.hmwbTeamNotes || '',
	    date: getCurrentDate(),
	    createdAt: Date.now()
	  }
	}
	if (hmwbSessionContentBelongsToCurrentEntity &&
    request.session.data.hmwbUniqueContentSaved &&
    request.session.data.hmwbUniqueContent &&
	  !localOverrides[entityKey].hmwbUniqueContent) {
	  localOverrides[entityKey].hmwbUniqueContent = {
	    value: request.session.data.hmwbUniqueContent,
	    notes: request.session.data.hmwbUniqueContentNotes || '',
	    date: getCurrentDate(),
	    createdAt: Date.now()
	  }
	}
	request.session.data.hmwbServiceInformation = ''
	request.session.data.hmwbTeamNotes = ''
	request.session.data.hmwbServiceInformationSaved = false
	request.session.data.hmwbUniqueContent = ''
	request.session.data.hmwbUniqueContentNotes = ''
	request.session.data.hmwbUniqueContentSaved = false
	const effectiveOverrides = ['updateCol', 'updateHof', ...localPolicyTypes]
    .reduce((overrides, type) => {
      overrides[type] = getEffectiveOverride(request.session.data, type, currentEntity)
      return overrides
    }, {})
  const hmwbContent = {
    hmwbImplications: effectiveOverrides.hmwbImplications.source === 'none'
      ? ''
      : effectiveOverrides.hmwbImplications.value,
    hmwbImplicationItems: effectiveOverrides.hmwbImplications.source === 'none'
      ? []
      : getPolicyInputItems(getLocallyOwnedPolicyValue(effectiveOverrides.hmwbImplications)),
    hmwbInheritedImplicationItems: getPolicyInputItems(effectiveOverrides.hmwbImplications.inheritedValue),
    hmwbImplicationNotes: effectiveOverrides.hmwbImplications.source === 'none'
      ? ''
      : effectiveOverrides.hmwbImplications.notes,
    hmwbUniqueContent: effectiveOverrides.hmwbUniqueContent.source === 'none'
      ? ''
      : effectiveOverrides.hmwbUniqueContent.value,
    hmwbUniqueContentNotes: effectiveOverrides.hmwbUniqueContent.source === 'none'
      ? ''
      : effectiveOverrides.hmwbUniqueContent.notes,
    hmwbImplicationsSourceUrl: effectiveOverrides.hmwbImplications.source === 'global'
      ? makeSummaryUrl(effectiveOverrides.hmwbImplications.sourceEntity)
      : '',
    hmwbImplicationsInheritedSources: getInheritedPolicySources(
      request.session.data,
      'hmwbImplications',
      currentEntity
    ),
    hmwbUniqueContentSourceUrl: effectiveOverrides.hmwbUniqueContent.source === 'global'
      ? makeSummaryUrl(effectiveOverrides.hmwbUniqueContent.sourceEntity)
      : ''
  }
  request.session.data.hmwbServiceInformation = hmwbContent.hmwbImplications
  request.session.data.hmwbTeamNotes = hmwbContent.hmwbImplicationNotes
  request.session.data.hmwbUniqueContent = hmwbContent.hmwbUniqueContent
  request.session.data.hmwbUniqueContentNotes = hmwbContent.hmwbUniqueContentNotes
  request.session.data.hmwbSessionContentEntityKey = entityKey
  const policyContent = localPolicyTypes.reduce((content, type) => {
    const config = localPolicyFields[type]
    const effective = effectiveOverrides[type]
    content[type] = {
      value: effective.source === 'none' ? '' : effective.value,
      items: localPolicyFields[type].isImplications && effective.source !== 'none'
        ? getPolicyInputItems(getLocallyOwnedPolicyValue(effective))
        : [],
      inheritedItems: localPolicyFields[type].isImplications
        ? getPolicyInputItems(effective.inheritedValue)
        : [],
      notes: effective.source === 'none' ? '' : effective.notes,
      source: effective.source,
      date: effective.date,
      sourceEntity: effective.sourceEntity,
      sourceUrl: effective.source === 'global' ? makeSummaryUrl(effective.sourceEntity) : '',
      inheritedSources: config.isImplications
        ? getInheritedPolicySources(request.session.data, type, currentEntity)
        : []
    }
    request.session.data[config.contentKey] = content[type].value
    request.session.data[config.notesKey] = content[type].notes
    request.session.data[config.savedKey] = Boolean(content[type].value)
    return content
  }, {})
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
  const operationalWaterBodyOverrideRecords = ['updateCol', 'updateHof', ...localPolicyTypes].reduce((overrides, type) => {
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
        const keptCount = waterBodies.filter(waterBody => waterBody.status ===
          (localPolicyTypes.includes(type) ? 'Existing value kept' : 'Existing override kept')).length
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
  const selectedWaterBodyOverrides = ['updateCol', 'updateHof', ...localPolicyTypes].reduce((overrides, type) => {
    overrides[type] = operationalWaterBodyOverrideRecords[type]
      .filter(record => !record.isAllWaterBodies)
    return overrides
  }, {})
  const allWaterBodyOverrides = ['updateCol', 'updateHof', ...localPolicyTypes].reduce((overrides, type) => {
    overrides[type] = operationalWaterBodyOverrideRecords[type]
      .filter(record => record.isAllWaterBodies)
    return overrides
  }, {})
  const operationalImplicationWaterBodyTargets = localPolicyTypes.reduce((targets, type) => {
    if (!localPolicyImplicationTypes.includes(type)) {
      targets[type] = { waterBodies: [], totalCount: 0 }
      return targets
    }

    const waterBodiesById = new Map()
    operationalWaterBodyOverrideRecords[type].forEach(record => {
      record.waterBodies.forEach(waterBody => {
        const key = String(waterBody.id)
        const current = waterBodiesById.get(key)
        if (!current || Number(record.createdAt || 0) >= current.createdAt) {
          waterBodiesById.set(key, {
            ...waterBody,
            createdAt: Number(record.createdAt || 0)
          })
        }
      })
    })
    const waterBodies = Array.from(waterBodiesById.values())
      .map(({ createdAt, ...waterBody }) => waterBody)
    targets[type] = { waterBodies, totalCount: waterBodies.length }
    return targets
  }, {})
  const operationalOverrideRecordIds = new Set(
    ['updateCol', 'updateHof', ...localPolicyTypes]
      .flatMap(type => selectedWaterBodyOverrides[type].concat(allWaterBodyOverrides[type]))
      .map(record => record.id)
  )
  const catchmentLevelOverrideSummaries = globalOverrideSummaries.filter(record =>
    !operationalOverrideRecordIds.has(record.id)
  )
  const inheritedOverrides = ['updateCol', 'updateHof', ...localPolicyTypes]
    .flatMap(type => getGlobalOverrides(request.session.data)
      .filter(record => record.type === type && record.targets.some(target =>
        target.key === entityKey &&
        target.applied &&
        isGlobalOverrideEffective(request.session.data, record, target)
      ))
      .map(record => ({
        type,
        action: 'applied',
        label: overrideTypes[type],
        value: record.value,
        displayValue: getOverrideDisplayValue(type, record.value),
        source: record.source,
        sourceUrl: makeSummaryUrl(record.source),
        sourceRecordId: record.id,
        date: record.date,
        notes: record.notes || ''
      })))
  const entityLevelLabel = selectedType === 'waterbody'
    ? 'water body'
    : selectedType === 'operationalCatchment'
      ? 'operational catchment'
      : 'management catchment'
  const localPolicyActions = localPolicyTypes.reduce((actions, type) => {
    const effective = effectiveOverrides[type]
    const isImplication = localPolicyImplicationTypes.includes(type)
    const actionLabel = localPolicyFields[type].actionLabel || localPolicyFields[type].applicationLabel
    actions[type] = {
      hasValue: effective.source !== 'none' &&
        (!isImplication || effective.source === 'local') &&
        Boolean(String(isImplication
          ? getLocallyOwnedPolicyValue(effective)
          : effective.value || '').trim()),
      isInherited: isImplication && effective.source === 'global',
      levelLabel: entityLevelLabel,
      addLabel: effective.source === 'global'
        ? `Add local ${entityLevelLabel} ${actionLabel}`
        : `Add ${entityLevelLabel} ${actionLabel}`,
      editLabel: `Edit ${entityLevelLabel} ${actionLabel}`,
      removeLabel: `Remove ${entityLevelLabel} ${actionLabel}`,
      editValue: `updatePolicy:${type}`,
      removeValue: `removePolicyContent:${type}`
    }
    return actions
  }, {})
  const overrideHistory = ['updateCol', 'updateHof', ...localPolicyTypes].reduce((history, type) => {
    const localHistory = (getOverrideHistory(request.session.data)[entityKey] || {})[type] || []
    const currentLocalOverride = getLocalOverrides(request.session.data)[entityKey] &&
      getLocalOverrides(request.session.data)[entityKey][type]
    const currentLocalEditRecordedGlobally = currentLocalOverride &&
      getGlobalOverrides(request.session.data).some(record =>
        record.type === type &&
        getEntityKey(record.source) === entityKey &&
        (record.editHistory || []).some(edit =>
          edit.value === currentLocalOverride.value && edit.date === currentLocalOverride.date
        )
      )
    const localHistoryWithCurrent = currentLocalOverride && currentLocalOverride.value && !localHistory.some(entry =>
      entry.value === currentLocalOverride.value &&
      entry.date === currentLocalOverride.date
    ) && !currentLocalEditRecordedGlobally
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
              `${relevantTargets.filter(target => target.applied && getEffectiveOverride(request.session.data, type, target).source === 'local').length} superseded by local ${localPolicyTypes.includes(type) ? 'applications' : 'overrides'}`,
              `${statusCount('kept')} kept`,
              `${statusCount('superseded')} superseded`,
              `${statusCount('removed')} removed`
            ].filter(text => !text.startsWith('0 ')).join(', ') ||
              `No descendants currently have this ${localPolicyTypes.includes(type) ? 'application' : 'override'}`
          : matchingTargets.map(target => {
              const statuses = {
                applied: 'Applied',
                kept: localPolicyTypes.includes(type) ? 'Existing value kept' : 'Existing override kept',
                superseded: localPolicyTypes.includes(type) ? 'Superseded by a later application' : 'Superseded by a later override',
                removed: 'Removed',
                'not applied': 'Not applied'
              }
              const targetStatus = target.status || (target.applied ? 'applied' : 'not applied')
              return target.applied
                ? getGlobalTargetStatus(request.session.data, record, target)
                : statuses[targetStatus] || 'Not applied'
            }).join(', ')
        const original = record.original || record
        const baseEntry = {
          type,
          action: original.action || 'applied',
          value: getOverrideDisplayValue(type, original.value),
          displayValue: getOverrideDisplayValue(type, original.value),
          previousDisplayValue: !isSource && matchingTargets[0].previousValue !== undefined
            ? getOverrideDisplayValue(type, matchingTargets[0].previousValue)
            : '',
          date: original.date,
          notes: original.notes || '',
          source: record.source,
          sourceUrl: makeSummaryUrl(record.source),
          scope: record.scope,
          status: statusText,
          statusDate: relevantTargets.find(target => target.statusDate)?.statusDate,
          email: record.createdByEmail || 'Not recorded',
          statusEmail: relevantTargets.find(target => target.statusEmail)?.statusEmail,
          createdAt: original.createdAt || 0
        }
        const editEntries = (record.editHistory || []).map(edit => ({
          ...baseEntry,
          ...edit,
          type,
          displayValue: getOverrideDisplayValue(type, edit.value),
          previousDisplayValue: getOverrideDisplayValue(type, edit.previousValue),
          source: record.source,
          sourceUrl: makeSummaryUrl(record.source),
          scope: record.scope,
          status: statusText,
          statusDate: relevantTargets.find(target => target.statusDate)?.statusDate,
          statusEmail: relevantTargets.find(target => target.statusEmail)?.statusEmail
        }))
        return [baseEntry, ...editEntries]
      })
    history[type] = localHistoryWithCurrent.map(entry => ({
      ...entry,
      type,
      displayValue: getOverrideDisplayValue(type, entry.value),
      previousDisplayValue: entry.previousValue === undefined
        ? ''
        : getOverrideDisplayValue(type, entry.previousValue),
      status: entry.action === 'removed'
        ? 'Removed'
        : entry.action === 'edited'
          ? 'Edited locally'
          : 'Applied locally',
      sourceName: entry.entity.name,
      createdAt: entry.createdAt || 0
    })).concat(globalHistory)
      .sort((first, second) => second.createdAt - first.createdAt)
    return history
  }, {})
  const policyHistories = Object.keys(policyFamilies).reduce((histories, policy) => {
    histories[policy] = [
      ...overrideHistory[`${policy}Implications`],
      ...overrideHistory[`${policy}UniqueContent`]
    ].sort((first, second) => second.createdAt - first.createdAt)
    return histories
  }, {})
  const wrgisStatus = manualActivationComponents.reduce((statuses, component) => {
    statuses[component] = getWrgisEffectiveState(request.session.data, component, currentEntity)
    return statuses
  }, {})
  const assessmentPointHistory = (request.session.data.assessmentPointHistory || {})[entityKey] || []

  response.render(templateFolder + 'manual-overrides-summary', {
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
    operationalImplicationWaterBodyTargets,
    inheritedOverrides,
    localPolicyActions,
    hmwbActions: localPolicyActions,
    localPolicyFields,
    policyContent,
    overrideHistory,
    policyHistories,
    wrgisConfig,
    wrgisStatus,
    assessmentPointHistory: assessmentPointHistory.slice().sort((first, second) => second.createdAt - first.createdAt),
    hmwbContent,
    hmwbHistory: (request.session.data.hmwbHistory || [])
      .concat(request.session.data.hmwbImplicationsHistory || [])
      .concat(overrideHistory.hmwbImplications, overrideHistory.hmwbUniqueContent)
      .sort((first, second) => second.createdAt - first.createdAt),
    data: request.session.data
	})
})

router.post('/manual-overrides-summary', function (request, response) {
	const upDate = request.body['manual-overrides-summary'] || request.session.data['manual-overrides-summary']
  if (String(upDate).startsWith('switchOffWrgis:')) {
    const component = String(upDate).slice('switchOffWrgis:'.length)
    const data = request.session.data
    const entity = data.currentOverrideEntity || getCurrentEntity(data)
    const state = manualActivationComponents.includes(component)
      ? getWrgisEffectiveState(data, component, entity)
      : null
    if (manualActivationComponents.includes(component) &&
      (!wrgisComponents.includes(component) || getWrgisConfig(request.session.data)[component] === 'no') &&
      state?.active &&
      state.local) {
      data.pendingWrgisSwitchOff = component
      return response.redirect(folder + 'confirm-wrgis-switch-off')
    }
    response.redirect(folder + 'manual-overrides-summary')
	} else if (String(upDate).startsWith('toggleWrgis:')) {
    const component = String(upDate).slice('toggleWrgis:'.length)
    const data = request.session.data
    const entity = data.currentOverrideEntity || getCurrentEntity(data)
    if (component === 'assessmentPoint') {
      return response.redirect(folder + 'update-ap')
    }
    if (wrgisComponents.includes(component) && getWrgisConfig(data)[component] === 'no') {
      const onRecords = getWrgisStateRecords(data, 'on')
      const offRecords = getWrgisStateRecords(data, 'off')
      const key = getEntityKey(entity)
      onRecords[component] = onRecords[component] || {}
      offRecords[component] = offRecords[component] || {}
      onRecords[component][key] = { date: getCurrentDate() }
      delete offRecords[component][key]
    }
    response.redirect(folder + 'manual-overrides-summary')
	} else if (upDate == "updateAp") {
    response.redirect(folder + "update-ap")
	} else if (upDate == "updateHof") {
		response.redirect(folder + "update-hof")
	} else if (upDate == "updateLp") {
		response.redirect(folder + "update-lp")
	} else if (upDate == "updateCol") {
		response.redirect(folder + "update-col")
	} else if (upDate == "updateHmwb") {
		response.redirect(folder + "update-hmwb")
  } else if (upDate === 'updateHmwbUniqueContent') {
    response.redirect(folder + 'update-hmwb-unique-content')
  } else if (String(upDate).startsWith('updatePolicy:')) {
    const requestedType = String(upDate).slice('updatePolicy:'.length)
    const type = legacyPolicyTypes[requestedType] || requestedType
    if (localPolicyFields[type]) {
      response.redirect(folder + localPolicyFields[type].route)
    } else {
      response.redirect(folder + 'manual-overrides-summary')
    }
  } else if (String(upDate).startsWith('removePolicyContent:')) {
    const type = String(upDate).slice('removePolicyContent:'.length)
    if (localPolicyTypes.includes(type)) {
      response.redirect(folder + `remove-policy-content/${type}`)
    } else {
      response.redirect(folder + 'manual-overrides-summary')
    }
  } else if (String(upDate).startsWith('removeLocal:') &&
    localPolicyTypes.includes(String(upDate).slice('removeLocal:'.length))) {
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
    if (type === 'hmwbImplications') {
      data.hmwbServiceInformation = ''
      data.hmwbTeamNotes = ''
      data.hmwbServiceInformationSaved = false
    } else if (type === 'hmwbUniqueContent') {
      data.hmwbUniqueContent = ''
      data.hmwbUniqueContentNotes = ''
      data.hmwbUniqueContentSaved = false
    }
    response.redirect(folder + 'manual-overrides-summary')
  } else if (String(upDate).startsWith('removePolicyTarget:') || String(upDate).startsWith('removeHmwbTarget:')) {
    response.redirect(folder + 'manual-overrides-summary')
  } else if (String(upDate).startsWith('editGlobalPolicy:')) {
    const data = request.session.data
    const recordId = String(upDate).slice('editGlobalPolicy:'.length)
    const entity = data.currentOverrideEntity || getCurrentEntity(data)
    const record = getGlobalOverrides(data).find(item =>
      item.id === recordId &&
      isLocalPolicyImplication(item.type) &&
      getEntityKey(item.source) === getEntityKey(entity)
    )
    if (record) {
      data.pendingGlobalPolicyEditId = record.id
      return response.redirect(folder + localPolicyFields[record.type].route)
    }
    response.redirect(folder + 'manual-overrides-summary')
  } else if (upDate === 'removeHmwb') {
    const data = request.session.data
    const entity = data.currentOverrideEntity || getCurrentEntity(data)
    const localOverrides = getLocalOverrides(data)
    const entityKey = getEntityKey(entity)
    const localOverride = localOverrides[entityKey] && localOverrides[entityKey].hmwbImplications
    if (localOverride) {
      addLocalOverrideHistory(data, entity, 'hmwbImplications', 'removed', localOverride, localOverride.value)
      delete localOverrides[entityKey].hmwbImplications
    }
    data.hmwbServiceInformation = ''
    data.hmwbTeamNotes = ''
    data.hmwbServiceInformationSaved = false
    response.redirect(folder + 'manual-overrides-summary')
  } else if (upDate === 'removeHmwbUniqueContent') {
    const data = request.session.data
    const entity = data.currentOverrideEntity || getCurrentEntity(data)
    const localOverrides = getLocalOverrides(data)
    const entityKey = getEntityKey(entity)
    const localOverride = localOverrides[entityKey] && localOverrides[entityKey].hmwbUniqueContent
    if (localOverride) {
      addLocalOverrideHistory(data, entity, 'hmwbUniqueContent', 'removed', localOverride, localOverride.value)
      delete localOverrides[entityKey].hmwbUniqueContent
    }
    data.hmwbUniqueContent = ''
    data.hmwbUniqueContentNotes = ''
    data.hmwbUniqueContentSaved = false
    response.redirect(folder + 'manual-overrides-summary')
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
    const data = request.session.data
    const recordId = String(upDate).slice('removeGlobal:'.length)
    const record = getGlobalOverrides(data).find(item => item.id === recordId)
    const currentEntity = data.currentOverrideEntity || getCurrentEntity(data)
    if (record && getEntityKey(record.source) === getEntityKey(currentEntity)) {
      data.pendingGlobalRemovalId = record.id
    }
    response.redirect(folder + 'remove-global')
	}
})

router.post(folder + 'start', function (request, response) {
	request.session.data.email = request.body.email
	response.redirect(folder + 'catchment-search')
})

router.get(folder + 'update-ap', function (request, response) {
  response.render(templateFolder + 'update-ap', { teamNotes: '' })
})

router.post(folder + 'update-ap', function (request, response) {
  const data = request.session.data
  const entity = data.currentOverrideEntity || getCurrentEntity(data)
  const key = getEntityKey(entity)
  const notes = String(request.body.teamNotes || '').trim()
  const onRecords = getWrgisStateRecords(data, 'on')
  const offRecords = getWrgisStateRecords(data, 'off')
  onRecords.assessmentPoint = onRecords.assessmentPoint || {}
  offRecords.assessmentPoint = offRecords.assessmentPoint || {}
  const record = { date: getCurrentDate(), notes }
  onRecords.assessmentPoint[key] = record
  delete offRecords.assessmentPoint[key]
  addAssessmentPointHistory(data, entity, 'activated', record, record.date)
	response.redirect(folder + 'manual-overrides-summary')
})

const saveLocalPolicyContent = (request, response, type, value, notes, { removedItems = [] } = {}) => {
  const data = request.session.data
  if (Array.isArray(value)) {
    value = getPolicyInputItems(value).join('\n')
  } else {
    value = String(value || '')
  }
  const currentEntity = data.currentOverrideEntity || getCurrentEntity(data)
  const entityKey = getEntityKey(currentEntity)
  const localOverride = getLocalOverrides(data)[entityKey] &&
    getLocalOverrides(data)[entityKey][type]
  const date = getCurrentDate()
  const inheritedOverride = getEffectiveOverride(data, type, currentEntity)
  const action = inheritedOverride.source === 'none' ? 'applied' : 'edited'
  if (currentEntity.type === 'waterbody' && value.trim() && inheritedOverride.source === 'global') {
    data.pendingOverride = {
      type,
      value,
      date,
      notes,
      action,
      previousValue: inheritedOverride.value,
      removedItems,
      source: currentEntity,
      inheritedSourceRecordId: inheritedOverride.sourceRecordId,
      localApplication: true
    }
    return response.redirect(folder + 'override-scope')
  }
  if (currentEntity.type !== 'waterbody' && value.trim()) {
    data.pendingOverride = {
      type,
      value,
      date,
      notes,
      action,
      previousValue: inheritedOverride.source === 'none' ? undefined : inheritedOverride.value,
      removedItems,
      source: currentEntity,
      inheritedSourceRecordId: currentEntity.type === 'operationalCatchment' &&
        inheritedOverride.source === 'global'
        ? inheritedOverride.sourceRecordId
        : undefined,
      stackInherited: Boolean(localOverride && localOverride.stackInherited),
      stackInheritedSourceRecordId: localOverride?.inheritedSourceRecordId,
      canStackInherited: currentEntity.type === 'operationalCatchment' &&
        isLocalPolicyImplication(type) &&
        inheritedOverride.source === 'global'
    }
    return response.redirect(folder + 'override-scope')
  }

  applyLocalOverride(data, currentEntity, type, value, notes, date, { removedItems })
  response.redirect(folder + 'manual-overrides-summary')
}

const applyLocalOverride = (data, currentEntity, type, value, notes, date, { removedItems = [] } = {}) => {
  const localOverrides = getLocalOverrides(data)
  const entityKey = getEntityKey(currentEntity)
  localOverrides[entityKey] = localOverrides[entityKey] || {}
  const previousOverride = getEffectiveOverride(data, type, currentEntity)
  if (value.trim()) {
    localOverrides[entityKey][type] = { value, notes, date, createdAt: Date.now() }
    addLocalOverrideHistory(
      data,
      currentEntity,
      type,
      previousOverride.source === 'none' ? 'applied' : 'edited',
      localOverrides[entityKey][type],
      previousOverride.source === 'none' ? undefined : previousOverride.value
    )
    if (removedItems.length) {
      addLocalOverrideHistory(
        data,
        currentEntity,
        type,
        'removed',
        { value: removedItems.join('\n'), notes },
        previousOverride.value
      )
    }
  } else if (localOverrides[entityKey][type]) {
    const removedOverride = localOverrides[entityKey][type]
    addLocalOverrideHistory(data, currentEntity, type, 'removed', removedOverride, removedOverride.value)
    delete localOverrides[entityKey][type]
  }
  const config = localPolicyFields[type]
  if (config) {
    data[config.contentKey] = value
    data[config.notesKey] = notes
    data[config.savedKey] = Boolean(value.trim())
  }
}

const renderRemovePolicyContent = (
  request,
  response,
  type,
  error,
  status = 200,
  { selectedIndexes = [], removeScope = 'selected' } = {}
) => {
  const config = localPolicyFields[type]
  const entity = request.session.data.currentOverrideEntity || getCurrentEntity(request.session.data)
  const effective = getEffectiveOverride(request.session.data, type, entity)
  const ownedValue = getRemovablePolicyValue(type, effective)
  const selected = new Set(selectedIndexes)
  const items = getPolicyContentItems(type, ownedValue)
    .map((value, index) => ({ index, value, selected: selected.has(index) }))

  if (!items.length) {
    return response.redirect(folder + 'manual-overrides-summary')
  }

  return response.status(status).render(templateFolder + 'remove-policy-content', {
    policyConfig: config,
    policyType: type,
    items,
    selectedIndexes,
    removeScope,
    error
  })
}

router.get(folder + 'remove-policy-content/:type', (request, response) => {
  const type = request.params.type
  if (!localPolicyTypes.includes(type)) {
    return response.sendStatus(404)
  }
  return renderRemovePolicyContent(request, response, type)
})

router.post(folder + 'remove-policy-content/:type', (request, response) => {
  const type = request.params.type
  if (!localPolicyTypes.includes(type)) {
    return response.sendStatus(404)
  }

  const data = request.session.data
  const entity = data.currentOverrideEntity || getCurrentEntity(data)
  const effective = getEffectiveOverride(data, type, entity)
  const ownedValue = getRemovablePolicyValue(type, effective)
  const items = getPolicyContentItems(type, ownedValue)
  if (!items.length) {
    return response.redirect(folder + 'manual-overrides-summary')
  }

  const removeAll = request.body.removeScope === 'all'
  const removeScope = request.body.removeScope
  if (!removeAll && request.body.removeScope !== 'selected') {
    return renderRemovePolicyContent(
      request,
      response,
      type,
      'Choose whether to remove selected items or all items.',
      400,
      { removeScope }
    )
  }

  const rawSelectedItems = request.body.selectedItems ?? request.body['selectedItems[]'] ?? []
  const submittedIndexes = [].concat(rawSelectedItems)
    .filter(value => String(value).trim() !== '')
  const selectedIndexes = submittedIndexes.map(Number)
  const validSelectedIndexes = selectedIndexes.filter((index, position) =>
    String(submittedIndexes[position]).trim() !== '' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < items.length
  )
  const invalidSelection = validSelectedIndexes.length !== selectedIndexes.length
  if (!removeAll && !selectedIndexes.length) {
    return renderRemovePolicyContent(
      request,
      response,
      type,
      'Select at least one item to remove.',
      400,
      { removeScope }
    )
  }
  if (!removeAll && invalidSelection) {
    return renderRemovePolicyContent(
      request,
      response,
      type,
      'The selected item could not be found. Review the list and select an item to remove.',
      400,
      { selectedIndexes: validSelectedIndexes, removeScope }
    )
  }

  const removedItems = removeAll
    ? items
    : [...new Set(selectedIndexes)].map(index => items[index])
  const removedIndexes = new Set(removeAll ? items.map((item, index) => index) : selectedIndexes)
  const remainingItems = items.filter((item, index) => !removedIndexes.has(index))

  if (effective.source === 'local' && isLocalPolicyImplication(type)) {
    const entityKey = getEntityKey(entity)
    const localOverrides = getLocalOverrides(data)
    const localOverride = localOverrides[entityKey][type]
    const removedValue = removedItems.map(item => item.value).join('\n')
    const sourceApplication = entity.type === 'operationalCatchment'
      ? getGlobalOverrides(data)
        .filter(record =>
          record.type === type &&
          getEntityKey(record.source) === entityKey
        )
        .sort((first, second) => Number(second.createdAt || 0) - Number(first.createdAt || 0))
        .find(record => record.targets.some(target => target.applied || target.status === 'kept'))
      : null
    if (sourceApplication && !remainingItems.length) {
      data.pendingGlobalRemovalId = sourceApplication.id
      return response.redirect(folder + 'remove-global')
    }
    if (sourceApplication && remainingItems.length) {
      updateGlobalPolicyContent(
        data,
        sourceApplication,
        remainingItems.map(item => item.value).join('\n'),
        effective.notes || ''
      )
      addLocalOverrideHistory(
        data,
        entity,
        type,
        'removed',
        { value: removedValue, notes: effective.notes || '' },
        effective.value
      )
      return response.redirect(folder + 'manual-overrides-summary')
    }
    if (remainingItems.length) {
      localOverride.value = remainingItems.map(item => item.value).join('\n')
      localOverride.date = getCurrentDate()
      localOverride.createdAt = Date.now()
      addLocalOverrideHistory(data, entity, type, 'edited', localOverride, effective.value)
    } else {
      delete localOverrides[entityKey][type]
    }
    addLocalOverrideHistory(
      data,
      entity,
      type,
      'removed',
      { value: removedValue, notes: effective.notes || '' },
      effective.value
    )
    const config = localPolicyFields[type]
    const currentOverride = getEffectiveOverride(data, type, entity)
    const locallyOwnedValue = currentOverride.source === 'local' ? currentOverride.value : ''
    data[config.contentKey] = locallyOwnedValue
    data[config.notesKey] = currentOverride.source === 'local' ? currentOverride.notes : ''
    data[config.savedKey] = Boolean(String(locallyOwnedValue).trim())
    return response.redirect(folder + 'manual-overrides-summary')
  }

  if (!remainingItems.length && effective.source === 'global' &&
    getEntityKey(effective.sourceEntity) === getEntityKey(entity)) {
    data.pendingGlobalRemovalId = effective.sourceRecordId
    return response.redirect(folder + 'remove-global')
  }

  if (remainingItems.length) {
    return saveLocalPolicyContent(
      request,
      response,
      type,
      remainingItems,
      effective.notes || '',
      { removedItems }
    )
  }

  const entityKey = getEntityKey(entity)
  const localOverrides = getLocalOverrides(data)
  localOverrides[entityKey] = localOverrides[entityKey] || {}
  if (effective.source === 'local') {
    delete localOverrides[entityKey][type]
  } else {
    localOverrides[entityKey][type] = {
      value: '',
      notes: effective.notes || '',
      date: getCurrentDate(),
      createdAt: Date.now()
    }
  }
  addLocalOverrideHistory(
    data,
    entity,
    type,
    'removed',
    { value: removedItems.join('\n'), notes: effective.notes || '' },
    effective.value
  )

  const config = localPolicyFields[type]
  const currentOverride = getEffectiveOverride(data, type, entity)
  const locallyOwnedValue = currentOverride.source === 'local' ? currentOverride.value : ''
  data[config.contentKey] = locallyOwnedValue
  data[config.notesKey] = currentOverride.source === 'local' ? currentOverride.notes : ''
  data[config.savedKey] = Boolean(String(locallyOwnedValue).trim())
  return response.redirect(folder + 'manual-overrides-summary')
})

router.get(folder + 'update-policy/:type', (request, response) => {
  const config = localPolicyFields[request.params.type]
  if (!config || hmwbOverrideTypes.includes(request.params.type)) {
    return response.sendStatus(404)
  }
  const entity = request.session.data.currentOverrideEntity || getCurrentEntity(request.session.data)
  const pendingEdit = getGlobalPolicyEditRecord(request.session.data, request.params.type, entity)
  if (request.session.data.pendingGlobalPolicyEditId && !pendingEdit) {
    delete request.session.data.pendingGlobalPolicyEditId
  }
  const effective = getEffectiveOverride(request.session.data, request.params.type, entity)
  const content = pendingEdit
    ? pendingEdit.value
    : config.isImplications
    ? effective.source === 'local' ? getLocallyOwnedPolicyValue(effective) : ''
    : request.session.data[config.contentKey] || ''
  response.render(templateFolder + 'update-policy-content', {
    policyConfig: config,
    content,
    contentItems: config.isImplications ? getPolicyInputItems(content) : [],
    notes: pendingEdit
      ? pendingEdit.notes || ''
      : config.isImplications
      ? effective.source === 'local' ? effective.notes || '' : ''
      : request.session.data[config.notesKey] || '',
    isInherited: !pendingEdit && config.isImplications && effective.source === 'global'
  })
})

router.get(folder + 'update-hmwb', (request, response) => {
  const entity = request.session.data.currentOverrideEntity || getCurrentEntity(request.session.data)
  const pendingEdit = getGlobalPolicyEditRecord(request.session.data, 'hmwbImplications', entity)
  if (request.session.data.pendingGlobalPolicyEditId && !pendingEdit) {
    delete request.session.data.pendingGlobalPolicyEditId
  }
  const effective = getEffectiveOverride(request.session.data, 'hmwbImplications', entity)
  response.render(templateFolder + 'update-hmwb', {
    contentItems: pendingEdit
      ? getPolicyInputItems(pendingEdit.value)
      : effective.source === 'local'
        ? getPolicyInputItems(getLocallyOwnedPolicyValue(effective))
        : [],
    teamNotes: pendingEdit
      ? pendingEdit.notes || ''
      : effective.source === 'local'
        ? effective.notes || ''
        : '',
    isInherited: !pendingEdit && effective.source === 'global'
  })
})

router.post(folder + 'update-hmwb', function (request, response) {
  const data = request.session.data
  const entity = data.currentOverrideEntity || getCurrentEntity(data)
  const value = request.body.moreDetail || []
  const notes = request.body.teamNotes || ''
  const pendingEdit = getGlobalPolicyEditRecord(data, 'hmwbImplications', entity)
  if (pendingEdit) {
    const normalizedValue = getPolicyInputItems(value).join('\n')
    if (!normalizedValue) {
      return response.status(400).render(templateFolder + 'update-hmwb', {
        contentItems: getPolicyInputItems(value),
        teamNotes: notes,
        isInherited: false,
        error: 'Enter at least one implication.'
      })
    }
    updateGlobalPolicyContent(data, pendingEdit, normalizedValue, notes)
    return response.redirect(folder + 'manual-overrides-summary')
  }
  delete data.pendingGlobalPolicyEditId
  saveLocalPolicyContent(request, response, 'hmwbImplications', value, notes)
})

router.post(folder + 'update-hmwb-unique-content', function (request, response) {
  saveLocalPolicyContent(request, response, 'hmwbUniqueContent', request.body.uniqueContent || '', request.body.uniqueContentNotes || '')
})

policyContentTypes.forEach(type => {
  const config = localPolicyFields[type]
  router.post(folder + config.route, function (request, response) {
    const data = request.session.data
    const entity = data.currentOverrideEntity || getCurrentEntity(data)
    const value = request.body[config.contentField] || []
    const notes = request.body[config.notesField] || ''
    const pendingEdit = getGlobalPolicyEditRecord(data, type, entity)
    if (pendingEdit) {
      const normalizedValue = getPolicyInputItems(value).join('\n')
      if (!normalizedValue) {
        return response.status(400).render(templateFolder + 'update-policy-content', {
          policyConfig: config,
          content: '',
          contentItems: getPolicyInputItems(value),
          notes,
          isInherited: false,
          error: 'Enter at least one implication.'
        })
      }
      updateGlobalPolicyContent(data, pendingEdit, normalizedValue, notes)
      return response.redirect(folder + 'manual-overrides-summary')
    }
    delete data.pendingGlobalPolicyEditId
    saveLocalPolicyContent(
      request,
      response,
      type,
      value,
      notes
    )
  })
})

Object.entries(legacyPolicyTypes).forEach(([legacyType, currentType]) => {
  const policy = legacyType
  router.post(folder + `update-${policy}`, function (request, response) {
    saveLocalPolicyContent(
      request,
      response,
      currentType,
      request.body.content || request.body[`${policy}Content`] || '',
      request.body.notes || request.body[`${policy}Notes`] || ''
    )
  })
})

router.post(folder + 'update-col', function (request, response) {
  if (!request.body.updateCol) {
    return response.status(400).render(templateFolder + 'update-col', {
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
    const inheritedOverride = getEffectiveOverride(request.session.data, 'updateCol', currentEntity)
    request.session.data.pendingOverride = {
      type: 'updateCol',
      value: request.body.updateCol,
      date,
      notes: request.body.moreDetailCol || '',
      source: currentEntity,
      inheritedSourceRecordId: currentEntity.type === 'operationalCatchment' &&
        inheritedOverride.source === 'global'
        ? inheritedOverride.sourceRecordId
        : undefined
    }
    return response.redirect(folder + 'override-scope')
  }

  const inheritedOverride = getEffectiveOverride(request.session.data, 'updateCol', currentEntity)
  if (inheritedOverride.source === 'global') {
    request.session.data.pendingOverride = {
      type: 'updateCol',
      value: request.body.updateCol,
      date,
      notes: request.body.moreDetailCol || '',
      source: currentEntity,
      inheritedSourceRecordId: inheritedOverride.sourceRecordId,
      localApplication: true
    }
    return response.redirect(folder + 'override-scope')
  }

  applyLocalOverride(request.session.data, currentEntity, 'updateCol', request.body.updateCol, request.body.moreDetailCol || '', date)
	response.redirect(folder + 'manual-overrides-summary')
})

router.post(folder + 'update-hof', function (request, response) {
  const value = request.body.updateHof === 'custom' ? request.body.updateHofValue : request.body.updateHof
  if (!value || value === 'custom') {
    return response.status(400).render(templateFolder + 'update-hof', {
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
    const inheritedOverride = getEffectiveOverride(request.session.data, 'updateHof', currentEntity)
    request.session.data.pendingOverride = {
      type: 'updateHof',
      value,
      date,
      notes: request.body.moreDetailHof || '',
      source: currentEntity,
      inheritedSourceRecordId: currentEntity.type === 'operationalCatchment' &&
        inheritedOverride.source === 'global'
        ? inheritedOverride.sourceRecordId
        : undefined
    }
    return response.redirect(folder + 'override-scope')
  }

  const inheritedOverride = getEffectiveOverride(request.session.data, 'updateHof', currentEntity)
  if (inheritedOverride.source === 'global') {
    request.session.data.pendingOverride = {
      type: 'updateHof',
      value,
      date,
      notes: request.body.moreDetailHof || '',
      source: currentEntity,
      inheritedSourceRecordId: inheritedOverride.sourceRecordId,
      localApplication: true
    }
    return response.redirect(folder + 'override-scope')
  }

  applyLocalOverride(request.session.data, currentEntity, 'updateHof', value, request.body.moreDetailHof || '', date)
	response.redirect(folder + 'manual-overrides-summary')
})

router.get(folder + 'override-scope', (request, response) => {
  const pending = request.session.data.pendingOverride
  if (!pending) {
    return response.redirect(folder + 'manual-overrides-summary')
  }

  response.render(templateFolder + 'override-scope', {
    pending,
    overrideLabel: overrideTypes[pending.type],
    policyApplicationLabel: localPolicyFields[pending.type]?.applicationLabel,
    canStackInherited: pending.canStackInherited,
    childLabel: pending.source.type === 'managementCatchment' ? 'operational catchments' : 'water bodies',
    inheritedOverride: pending.inheritedSourceRecordId
      ? getEffectiveOverride(request.session.data, pending.type, pending.source)
      : null,
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
  if (pending.inheritedSourceRecordId) {
    const inheritedChoices = pending.canStackInherited
      ? ['yes', 'no', 'stack']
      : ['yes', 'no']
    if (!inheritedChoices.includes(request.body.replaceInherited)) {
      return response.status(400).render(templateFolder + 'override-scope', {
        pending,
        overrideLabel: overrideTypes[pending.type],
        policyApplicationLabel: localPolicyFields[pending.type]?.applicationLabel,
        canStackInherited: pending.canStackInherited,
        childLabel: 'water bodies',
        inheritedOverride: getEffectiveOverride(request.session.data, pending.type, pending.source),
        replaceInheritedError: 'Choose whether to replace the inherited value for this area.'
      })
    }
    pending.replaceInherited = request.body.replaceInherited !== 'no'
    pending.stackInherited = request.body.replaceInherited === 'stack'
    if (!pending.replaceInherited) {
      delete request.session.data.pendingOverride
      return response.redirect(folder + 'manual-overrides-summary')
    }
    if (pending.localApplication && pending.source.type === 'waterbody') {
      applyLocalOverride(
        request.session.data,
        pending.source,
        pending.type,
        pending.value,
        pending.notes,
        pending.date,
        { removedItems: pending.removedItems || [] }
      )
      delete request.session.data.pendingOverride
      return response.redirect(folder + 'manual-overrides-summary')
    }
  }
  if (request.body.scopeDecision === 'selected') {
    pending.scope = 'selected'
    return response.redirect(folder + 'override-descendants')
  }
  if (request.body.scopeDecision !== 'all') {
    return response.status(400).render(templateFolder + 'override-scope', {
      pending,
      overrideLabel: overrideTypes[pending.type],
      policyApplicationLabel: localPolicyFields[pending.type]?.applicationLabel,
      canStackInherited: pending.canStackInherited,
      childLabel: pending.source.type === 'managementCatchment' ? 'operational catchments' : 'water bodies',
      inheritedOverride: pending.inheritedSourceRecordId
        ? getEffectiveOverride(request.session.data, pending.type, pending.source)
        : null,
      error: localPolicyTypes.includes(pending.type)
        ? 'Select whether to apply this content to all descendants or choose specific descendants.'
        : 'Select whether to apply the override to all descendants or choose specific descendants.'
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
    response.render(templateFolder + 'override-descendants', {
      pending,
      overrideLabel: overrideTypes[pending.type],
      policyApplicationLabel: localPolicyFields[pending.type]?.applicationLabel,
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

  if (conflicts.length && !isUniqueLocalPolicyContent(pending.type)) {
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
  response.render(templateFolder + 'override-conflicts', {
    pending: data.pendingOverride,
    overrideLabel: overrideTypes[data.pendingOverride.type],
    isImplication: isLocalPolicyImplication(data.pendingOverride.type),
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
  const allowedStrategies = ['replaceAll', 'keepAll', 'individual']
  if (isLocalPolicyImplication(data.pendingOverride.type)) {
    allowedStrategies.push('stackAll')
  }
  if (!allowedStrategies.includes(strategy)) {
    return response.status(400).render(templateFolder + 'override-conflicts', {
      pending: data.pendingOverride,
      overrideLabel: overrideTypes[data.pendingOverride.type],
      isImplication: isLocalPolicyImplication(data.pendingOverride.type),
      conflicts: data.overrideConflicts.map(conflict => ({
        ...conflict,
        displayValue: getOverrideDisplayValue(data.pendingOverride.type, conflict.conflict.value)
      })),
      error: isLocalPolicyImplication(data.pendingOverride.type)
        ? 'Choose how to handle existing implications.'
        : 'Choose how to handle existing overrides.'
    })
  }

  const individualChoices = isLocalPolicyImplication(data.pendingOverride.type)
    ? ['replace', 'keep', 'stack']
    : ['replace', 'keep']
  if (strategy === 'individual' && data.overrideConflicts.some((conflict, index) =>
    !individualChoices.includes(request.body[`conflict-${index}`])
  )) {
    return response.status(400).render(templateFolder + 'override-conflicts', {
      pending: data.pendingOverride,
      overrideLabel: overrideTypes[data.pendingOverride.type],
      isImplication: isLocalPolicyImplication(data.pendingOverride.type),
      conflicts: data.overrideConflicts.map((conflict, index) => ({
        ...conflict,
        displayValue: getOverrideDisplayValue(data.pendingOverride.type, conflict.conflict.value),
        missingChoice: !individualChoices.includes(request.body[`conflict-${index}`])
      })),
      error: isLocalPolicyImplication(data.pendingOverride.type)
        ? 'Choose whether to replace, keep or add to each existing implication.'
        : 'Choose whether to replace or keep each existing override.'
    })
  }

  const replaceChoices = {}
  data.overrideConflicts.forEach((conflict, index) => {
    replaceChoices[conflict.key] = strategy === 'replaceAll'
      ? 'replace'
      : strategy === 'stackAll'
        ? 'stack'
        : strategy === 'individual'
          ? request.body[`conflict-${index}`]
          : 'keep'
  })
  saveGlobalOverride(data, data.overrideTargets, replaceChoices)
  response.redirect(folder + 'manual-overrides-summary')
})

router.get(folder + 'remove-global', (request, response) => {
  const data = request.session.data
  const record = getGlobalOverrides(data).find(item => item.id === data.pendingGlobalRemovalId)
  const currentEntity = data.currentOverrideEntity || getCurrentEntity(data)
  if (!record || getEntityKey(record.source) !== getEntityKey(currentEntity)) {
    delete data.pendingGlobalRemovalId
    return response.redirect(folder + 'manual-overrides-summary')
  }
  response.render(templateFolder + 'remove-global', {
    record,
    overrideLabel: overrideTypes[record.type],
    isLocalPolicy: localPolicyTypes.includes(record.type)
  })
})

router.post(folder + 'remove-global', (request, response) => {
  const data = request.session.data
  const record = getGlobalOverrides(data).find(item => item.id === data.pendingGlobalRemovalId)
  const currentEntity = data.currentOverrideEntity || getCurrentEntity(data)
  if (!record || getEntityKey(record.source) !== getEntityKey(currentEntity)) {
    delete data.pendingGlobalRemovalId
    return response.redirect(folder + 'manual-overrides-summary')
  }
  if (request.body.removeScope === 'selected') {
    return response.redirect(folder + 'remove-global-descendants')
  }
  if (request.body.removeScope !== 'all') {
    return response.status(400).render(templateFolder + 'remove-global', {
      record,
      overrideLabel: overrideTypes[record.type],
      isLocalPolicy: localPolicyTypes.includes(record.type),
      error: localPolicyTypes.includes(record.type)
        ? 'Select whether to remove the content from all descendants or choose specific descendants.'
        : 'Select whether to remove the override from all descendants or choose specific descendants.'
    })
  }
  const removedTargets = record.targets.filter(target =>
    target.applied || target.status === 'kept'
  )
  removeInheritedImplicationsFromOperationalStacks(data, record, removedTargets)
  removedTargets.forEach(target => {
    target.applied = false
    target.status = 'removed'
    target.statusDate = getCurrentDate()
    target.statusEmail = data.email || 'Not recorded'
  })
  removeSourcePolicyContent(data, record)
  delete data.pendingGlobalRemovalId
  response.redirect(folder + 'manual-overrides-summary')
})

const removeSourcePolicyContent = (data, record) => {
  if (!localPolicyTypes.includes(record.type) || record.source.type !== 'operationalCatchment') {
    return
  }
  const entityKey = getEntityKey(record.source)
  const localOverrides = getLocalOverrides(data)
  const localOverride = localOverrides[entityKey] && localOverrides[entityKey][record.type]
  if (!localOverride) {
    return
  }
  addLocalOverrideHistory(data, record.source, record.type, 'removed', localOverride, localOverride.value)
  delete localOverrides[entityKey][record.type]
  const config = localPolicyFields[record.type]
  data[config.contentKey] = ''
  data[config.notesKey] = ''
  data[config.savedKey] = false
}

const removeLastPolicyImplicationSequence = (value, sequenceValue) => {
  const lines = getPolicyImplicationLines(value)
  const sequence = getPolicyImplicationLines(sequenceValue)
  for (let start = lines.length - sequence.length; start >= 0; start -= 1) {
    if (sequence.every((line, index) => lines[start + index] === line)) {
      lines.splice(start, sequence.length)
      break
    }
  }
  return lines
}

const removeInheritedImplicationsFromOperationalStacks = (data, record, removedTargets) => {
  if (record.source.type !== 'managementCatchment' ||
    !isLocalPolicyImplication(record.type) ||
    !getPolicyImplicationLines(record.value).length) {
    return
  }

  const operationalIds = new Set(removedTargets.flatMap(target => {
    if (target.type === 'operationalCatchment') {
      return [String(target.id)]
    }
    return target.type === 'waterbody' && target.operationalCatchmentId
      ? [String(target.operationalCatchmentId)]
      : []
  }))
  if (!operationalIds.size) {
    return
  }

  const operationalRecords = getGlobalOverrides(data)
    .filter(candidate =>
      candidate !== record &&
      candidate.type === record.type &&
      candidate.source.type === 'operationalCatchment' &&
      operationalIds.has(String(candidate.source.id))
    )
  operationalRecords.forEach(operationalRecord => {
      operationalRecord.targets
        .filter(target => target.applied && target.status === 'stacked')
        .forEach(target => {
          const ownLines = getPolicyImplicationLines(operationalRecord.value)
          const inheritedLines = target.stackedValues
            ? ownLines.length
              ? getPolicyImplicationLines(target.stackedValues).slice(0, -ownLines.length)
              : getPolicyImplicationLines(target.previousValue)
            : getPolicyImplicationLines(target.previousValue)
          const updatedInheritedLines = removeLastPolicyImplicationSequence(
            inheritedLines,
            record.value
          )
          target.previousValue = updatedInheritedLines.join('\n')
          target.stackedValues = [...updatedInheritedLines, ...ownLines]
        })
    })

  const latestOperationalRecord = operationalRecords
    .slice()
    .sort((first, second) => (second.createdAt || 0) - (first.createdAt || 0))[0]
  if (latestOperationalRecord) {
    const sourceKey = getEntityKey(latestOperationalRecord.source)
    const localOverrides = getLocalOverrides(data)
    const localOverride = localOverrides[sourceKey] &&
      localOverrides[sourceKey][record.type]
    if (localOverride && localOverride.stackInherited) {
      localOverride.value = latestOperationalRecord.value
      localOverride.inheritedSourceRecordId = undefined
    }
  }
}

router.get(folder + 'cancel-global-removal', (request, response) => {
  delete request.session.data.pendingGlobalRemovalId
  delete request.session.data.globalRemovalError
  response.redirect(folder + 'manual-overrides-summary')
})

router.get(folder + 'remove-global-descendants', (request, response) => {
  const data = request.session.data
  const record = getGlobalOverrides(data).find(item => item.id === data.pendingGlobalRemovalId)
  const currentEntity = data.currentOverrideEntity || getCurrentEntity(data)
  if (!record || getEntityKey(record.source) !== getEntityKey(currentEntity)) {
    delete data.pendingGlobalRemovalId
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
  response.render(templateFolder + 'remove-global-descendants', {
    record,
    overrideLabel: overrideTypes[record.type],
    isLocalPolicy: localPolicyTypes.includes(record.type),
    children,
    childLabel: choiceType === 'operationalCatchment' ? 'operational catchments' : 'water bodies',
    error: data.globalRemovalError
  })
  delete data.globalRemovalError
})

router.post(folder + 'remove-global-descendants', (request, response) => {
  const data = request.session.data
  const record = getGlobalOverrides(data).find(item => item.id === data.pendingGlobalRemovalId)
  const currentEntity = data.currentOverrideEntity || getCurrentEntity(data)
  if (!record || getEntityKey(record.source) !== getEntityKey(currentEntity)) {
    delete data.pendingGlobalRemovalId
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
  const removedTargets = record.targets.filter(target => {
    const selected = (target.type === removableTargetType && selectedIds.includes(String(target.id))) ||
      (record.source.type === 'managementCatchment' &&
        target.type === 'waterbody' &&
        selectedIds.includes(String(target.operationalCatchmentId)))
    return selected && (target.applied || target.status === 'kept')
  })
  removeInheritedImplicationsFromOperationalStacks(data, record, removedTargets)
  removedTargets.forEach(target => {
    target.applied = false
    target.status = 'removed'
    target.statusDate = getCurrentDate()
    target.statusEmail = data.email || 'Not recorded'
  })
  removeSourcePolicyContent(data, record)
  delete data.pendingGlobalRemovalId
  response.redirect(folder + 'manual-overrides-summary')
})

module.exports = router