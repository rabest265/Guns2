var ShootList = ["injuries only", "mass shooting", "no injuries", "some dead"]

/* data route */
var url = "/jsonifiedsummary";
d3.json(url).then(function(response) {
  console.log(response);
  var shoot_type = [];
  var incidents = [];
  
  for(var i=0; i < response.length; i++) {
    shoot_type.push(response[i].shoot_type);
    incidents.push(response[i].Incidents_per_100M);
  }
  console.log(shoot_type);
  console.log(incidents);
    
    // 0: "injuries only"
    // 1: "mass shooting"
    // 2: "no injuries"
    // 3: "some dead"

  var url2 = "/jsonifiedstatesummary";
  d3.json(url2).then(function(response2) {
    console.log(response2);
    // var data = response2;

    var selectlong = `*`;


    $( ".filterdown" ).change(function() {
      var lg = document.getElementById("longgun");
      var selectLong = lg.options[lg.selectedIndex].value;

      var asst = document.getElementById("assault");
      var selectAsst = asst.options[asst.selectedIndex].value;

      var ment = document.getElementById("mental");
      var selectMent = ment.options[ment.selectedIndex].value;
      
      var univ = document.getElementById("universal");
      var selectUniv = univ.options[univ.selectedIndex].value;

      var data = response2;

    // });
    if (selectLong != "*")
      var data = data.filter(d=>d.age18longgunpossess == selectLong);
    if (selectAsst != "*")
      var data = data.filter(d=>d.assault == selectAsst);
    if (selectMent != "*")
      var data = data.filter(d=>d.mentalhealth == selectMent);
    if (selectUniv != "*")
      var data = data.filter(d=>d.universal == selectUniv);


    var statedata = data.filter(d=>d.shoot_type == "injuries only");
    var stateCount = statedata.length + " States";
    console.log(stateCount);
    
    console.log(data)


    var injonly = [];
    var massht = [];
    var noinj = [];
    var dead = [];

    var injonlypop = [];
    var masshtpop = [];
    var noinjpop = [];
    var deadpop = [];

    for(var j=0; j < data.length; j++) {
      if (data[j].shoot_type == "injuries only")
        injonly.push(data[j].Count),
        injonlypop.push(data[j].pop_estimate_2015);
      else if (data[j].shoot_type == "mass shooting")
        massht.push(data[j].Count),
        masshtpop.push(data[j].pop_estimate_2015);
      else if (data[j].shoot_type == "no injuries")
        noinj.push(data[j].Count),
        noinjpop.push(data[j].pop_estimate_2015);
      else if (data[j].shoot_type == "some dead")
        dead.push(data[j].Count),
        deadpop.push(data[j].pop_estimate_2015);
    }

    var incidents2 = []; 
    incidents2.push((injonly.reduce((a, b) => a + b, 0)/injonlypop.reduce((a, b) => a + b,))*100000000);
    incidents2.push((massht.reduce((a, b) => a + b, 0)/masshtpop.reduce((a, b) => a + b,))*100000000);
    incidents2.push((noinj.reduce((a, b) => a + b, 0)/noinjpop.reduce((a, b) => a + b,))*100000000);
    incidents2.push((dead.reduce((a, b) => a + b, 0)/deadpop.reduce((a, b) => a + b,))*100000000);
    

    console.log(incidents2);

    var trace1 = {
      x: ['All states',stateCount],
      y: [incidents[2], incidents2[2]],
      name: shoot_type[2],
      type: 'bar'
    };

    var trace2 = {
      x: ['All states',stateCount],
      y: [incidents[0], incidents2[0]],
      name: shoot_type[0],
      type: 'bar'
    };

    var trace3 = {
      x: ['All states',stateCount],
      y: [incidents[3], incidents2[3]],
      name: shoot_type[3],
      type: 'bar'
    };

    var trace4 = {
      x: ['All states',stateCount],
      y: [incidents[1], incidents2[1]],
      name: shoot_type[1],
      type: 'bar'
    };

    var data = [trace1, trace2, trace3, trace4];

    var layout = {
      barmode: 'stack',
      title: "# of Incidents per 100M people",
    };

    Plotly.newPlot('plot', data, layout);

    // chart.render()
  });
  });
});