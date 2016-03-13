

if (Meteor.isClient) {
 
  // This code only runs on the client
  angular.module('simple-todos',['angular-meteor']);
 
  angular.module('simple-todos').controller('TodosListCtrl', ['$scope',
    function ($scope) {
      $scope.parameters = {
        project_life: 20, 
        nameplate_MW: 1,          
        module_cost: 0.39,          
        inverter_cost: 0.15,          
        operation_maintenance_fixed: 25000,          
        plant_derating_factor: 0.85,
        plant_degradation_factor: 0.01,           
        discount_rate: 0.1,         
        corporate_tax: 0.3,
        av_psh_per_day: 5,           
      }
      $scope.lcoe = 0;

      $scope.calculate = function(){
        // Convert parameters from input forms to floats.
        for (var key in $scope.parameters) {
          $scope.parameters[key] = parseFloat($scope.parameters[key]);
        }
        // Calculate lcoe threshold
        var lcoe_threshold = calculateLCOE($scope.parameters);
        // Set the lcoe threshold on the page
        $scope.lcoe = lcoe_threshold;
      }


    
      $scope.tasks = [
        { text: 'This is task 1' },
        { text: 'This is task 2' },
        { text: 'This is task 3' }
      ];
 
  }]);
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

function calculateLCOE(parameters){
  var p = parameters;
  // Calculate Plant Cap Cost
  var nameplate_watts = 1000000 * p.nameplate_MW;
  var capital_cost = nameplate_watts * (p.module_cost + p.inverter_cost)
  //Calculate plant yearly cash outflows
  var yearly_capital_cost = capital_cost / p.project_life;
  var yearly_cash_outflows = yearly_capital_cost + p.operation_maintenance_fixed;
  //Calculate yearly energy out (MWh)
  var yearly_energy_out = p.nameplate_MW * p.plant_derating_factor * p.av_psh_per_day * 365;

  //calculate yearly discounted cash and energy outflows.
  //note it appears (as in Branker et al.) that we are discounting energy as well but it's a result of arithmetic
  //of rearranging primary LCOE definition formula.
  
  //summing stage, find cost and energy terms (numerator and denominator in eqn 2)
  var cost_term = 0;
  var energy_term = 0;
  for(var t = 0; t< p.project_life+1; t++){
    cost_term += yearly_cash_outflows / Math.pow(1 + p.discount_rate, t);
    energy_term += yearly_energy_out * Math.pow(1 - p.plant_degradation_factor, t) / Math.pow(1+p.discount_rate, t);
  }
  var lcoe = cost_term/energy_term;
  var lcoe_threshold = lcoe/ (1-p.corporate_tax);
  return lcoe_threshold;

}


