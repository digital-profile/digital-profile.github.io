var fs  = require("fs");

var output = '{ "nodes":[{ "group": 0, "text":"Digital People", "tags":["People","Digital literacy","Digital consumption","Online skills","Visual perception / information visualisation","Cognitive processing","Social ties / social network","Social behaviour / social networking","Workplace connectivity","Quantified workplace","Electronic collaboration","Quantified self / self-tracking","Extended self","Digital footprint","Digital neighbourhood","Privacy and digital surveillance","Personality traits","Physical disorders","Impact of computerisation","Diversity"] },\n' // array shift or w/e this to top?
var DigitalPeople = output;

  // fs.readFileSync('./Data/tags.tsv').toString().trim().split('\n').forEach(function (line) { //First read tags
  //     var columns = line.replace(/(\r\n|\n|\r)/gm,"").split('\t')
  //     columns = columns.filter(function(entry) { return entry.trim() != ''; }); // add to above .split
  //     console.log(line);
  //     var parent;
  //     for (var i = 1; i <= columns.length; i++) {
  //       !columns[i] ? parent = columns[i-1] : parent = columns[i]
  //       output += ' { "group": '+i+', "text":['+JSON.stringify(columns[i-1])+'], "tags":['+JSON.stringify(parent)+'] }, \n'
  //     }
  // });
  var Tags = ''
  var parent;
  var child
  var grandchild
  fs.readFileSync('./Data/Digital Profile - Tags.tsv').toString().trim().split('\n').forEach(function (line) { //First read tags
   var columns = line.replace(/(\r\n|\n|\r)/gm,"").split('\t')
   if(columns[0]) {
     parent = columns[0]
     output += ' { "group": 1, "text":['+JSON.stringify(parent)+'], "tags":['+JSON.stringify(parent)+'] },'
     }
   if(columns[1]) { child = columns[1]
     output += ' { "group": 2, "text":['+JSON.stringify(child)+'], "tags":['+JSON.stringify(parent)+'] }, '
     }
   if(columns[2]) { grandchild = columns[2]
     output += ' { "group": 3, "text":['+JSON.stringify(grandchild)+'], "tags":['+JSON.stringify(child)+'] }, '
     }
  });

var dataPoints = ""

  fs.readFileSync('./Data/Digital Profile - Digital Profile.tsv').toString().trim().split('\n').forEach(function (line) { //Then data

    var columns = line.split('\t');
    var referenceStr = ''
    if(columns[0].indexOf(',')>-1){
      var multiReference = columns[0].split(',')
      for (var i = 0; i < multiReference.length; i++) {
        referenceStr+= '{"number":'+ multiReference[i]+'},'
      }
      referenceStr = referenceStr.replace(/,(?=[^,]*$)/, '')
    }else{
      referenceStr = '{"number":'+ columns[0]+'}'
    }

    if(!columns[1]){
      columns[1] = 0;
    }

    var tags = [];
    for(var i = 3; i<columns.length; i++) {
      columns[i] = columns[i].replace(/(\r\n|\n|\r)/gm,"")
      if(columns[i].length>1){
        tags.push(JSON.stringify(columns[i]))
      }
    }
    for (var i = 0; i < tags.length; i++) {
    dataPoints += '{"group": 5, "text":['+JSON.stringify(columns[2])+'], "references":['+referenceStr+'], "year": "'+columns[1]+'",  "tags":['+(tags[i])+']},'
    }
  })

output += dataPoints+'          ] }'
output = output.replace(/,(?=[^,]*$)/, '')

var x = JSON.parse(output); //Have to parse to use in JS, to remove duplicates.

var group1 = x.nodes.filter(function(node){
    return (node.group == 1);
})
var group2 = x.nodes.filter(function(node){
    return (node.group == 2);
})
var group3 = x.nodes.filter(function(node){
    return (node.group == 3);
})
var group5 = x.nodes.filter(function(node){
    return (node.group == 5);
})
var group0 = x.nodes.filter(function(node){
    return (node.group == 0);
})

group1 = merge(group1)
group2 = merge(group2)
group3 = merge(group3)

fs.readFileSync('./Data/Digital Profile - Bibliography.tsv').toString().trim().split('\n').forEach(function(line) {
  var columns = line.replace(/(\r\n|\n|\r)/gm,"").split('\t')

  for (var i = 0; i < group5.length; i++) {
    for (var j = 0; j < group5[i].references.length; j++) {
      if(columns[0] == group5[i].references[j].number){
          group5[i].references[j].text = columns[1]
      }
    }
  }
})

output = JSON.stringify(group0.concat(group1, group2, group3, group5)); // an array of the nodes and datapoints.

output = '{ "nodes": '+output+' , "links": '+JSON.stringify(createLinks(output)) +'}'

function merge(grouping) {
    for (var i=1; i< grouping.length;)          {   // every node {} in the arr
      if(grouping[i].text[0] === grouping[i-1].text[0]){
        for (var j = 0; j < grouping[i].tags.length; j++) {   // for the first nodes tags
          grouping[i-1].tags.push(grouping[i].tags[j])    // add them to the 2nd nodes tags
        }
        grouping.splice(i, 1)     // delete the first node
      }else{
        i++
      }

    }
    return grouping /// will have duplicate tags in groups, remove in links.
}

function createLinks(nodes){
  nodes = JSON.parse(nodes)
  var rawLinks = [];
  for (var i=0; i< nodes.length; i++){   // every element
    for (var j=0; j< nodes[i].tags.length; j++){    //every node {}s tags []
      for (var k=0; k< nodes.length; k++){          // every node {}
        if(nodes[i].tags[j] == nodes[k].text) { // if they are not the same node, or same group.
            if(nodes[i].group != nodes[k].group){
              rawLinks.push({"source": i,"target":k, "sourceName": nodes[i].text, "targetName": nodes[k].text })
            }
        }
      }
    }
  }

  for (var i=0; i< nodes.length; i++){ // perhaps adapt to other groups.
    if(nodes[i].group == 1){
      rawLinks.push({"source": 0,"target":i})
    }
  }
  return removeDups(rawLinks); // return removeDups
}


function removeDups(a){ // possible not any actual duplicates.
  a.forEach(function(d){     //for each element in rawLinks, d
    var sourceTemp = d.source;
    var targetTemp = d.target;       //take the values and assign
    if(d.source > d.target){         // if d.s > d.t
      d.source = targetTemp;          // assign d.t to d.target
      d.target = sourceTemp;
    }
  });

  a.sort();
  for(var i = 1; i < a.length; ){
      if(a[i-1].source == a[i].source && a[i-1].target == a[i].target){
          a.splice(i, 1);
          } else {
          i++;
          }
      }
  return a;
}


fs.appendFileSync("./tempoutput.json", output);
