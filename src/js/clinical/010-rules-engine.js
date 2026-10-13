/*
 Clinical Knowledge Engine foundation.
 Rules only provide decision support.
 No diagnosis or autonomous treatment decisions.
*/
(function(){
  const rules=[];

  function registerRule(rule){
    rules.push(rule);
  }

  function evaluate(context){
    return rules
      .filter(rule=>rule.match(context))
      .map(rule=>({
        id:rule.id,
        level:rule.level || 'info',
        message:rule.message
      }));
  }

  window.POClinicalRules={
    registerRule,
    evaluate
  };
})();
