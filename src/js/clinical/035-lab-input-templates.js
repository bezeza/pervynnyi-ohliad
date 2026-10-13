/*
 Laboratory input templates foundation.
 Provides structured fast entry fields for clinical data.
 No diagnosis or treatment decisions are made here.
*/
(function(){
  const templates={
    basicBlood:{
      id:'basic-blood',
      title:'Загальний аналіз крові',
      fields:[
        {key:'Hb',label:'Hb',unit:'g/L'},
        {key:'WBC',label:'WBC',unit:'10^9/L'},
        {key:'PLT',label:'PLT',unit:'10^9/L'}
      ]
    },
    inflammation:{
      id:'inflammation',
      title:'Запальні показники',
      fields:[
        {key:'CRP',label:'CRP',unit:'mg/L'},
        {key:'ESR',label:'ШОЕ',unit:'mm/h'}
      ]
    },
    renal:{
      id:'renal',
      title:'Функція нирок',
      fields:[
        {key:'Creatinine',label:'Креатинін',unit:'µmol/L'},
        {key:'eGFR',label:'eGFR',unit:'ml/min'}
      ]
    }
  };

  function getTemplate(id){
    return templates[id] || null;
  }

  function listTemplates(){
    return Object.values(templates);
  }

  window.POLabTemplates={getTemplate,listTemplates};
})();
