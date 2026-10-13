/*
 Laboratory rules foundation for Clinical Knowledge Engine.
 Decision support only. Does not diagnose or prescribe.
*/
(function(){
  const rules=[];

  function registerLabRule(rule){
    rules.push(rule);
  }

  function evaluateLabs(context={}){
    return rules
      .filter(rule=>rule.match(context))
      .map(rule=>({
        id:rule.id,
        level:rule.level || 'info',
        message:rule.message,
        source:rule.source || null
      }));
  }

  registerLabRule({
    id:'hb-low-check',
    match(context){
      return context.labs && context.labs.Hb !== undefined && context.labs.Hb < 100;
    },
    level:'warning',
    message:'Значення Hb нижче заданого порогу. Перевірте клінічний контекст та повноту оцінки.',
    source:'local clinical rule'
  });

  window.POClinicalLabRules={
    registerLabRule,
    evaluateLabs
  };
})();
