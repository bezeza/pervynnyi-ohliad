/*
 Clinical Knowledge Engine - Drug Rules foundation.
 Rules provide warnings and explanations only.
 No automatic prescribing or treatment decisions.
*/
(function(){
  const rules=[];

  function registerDrugRule(rule){
    rules.push(rule);
  }

  function evaluateMedication(context){
    const results=[];
    rules.forEach(rule=>{
      if(rule.match(context)){
        results.push({
          id:rule.id,
          medication:rule.medication,
          level:rule.level || 'info',
          message:rule.message,
          source:rule.source || null
        });
      }
    });
    return results;
  }

  registerDrugRule({
    id:'ceftriaxone-review',
    medication:'ceftriaxone',
    level:'warning',
    match(context){
      return (context.medications||[]).some(m=>String(m).toLowerCase().includes('цефт'));
    },
    message:'Перевірити показання, наявність обґрунтування антибіотикотерапії та необхідність мікробіологічного контролю згідно локальних протоколів.',
    source:'clinical protocol reference required'
  });

  window.PODrugRules={
    registerDrugRule,
    evaluateMedication
  };
})();
