var fs  = require("fs");

var output = '[ '
  var parent;
  var child
  var grandchild
  fs.readFileSync('./Data/Digital Profile - Tags.tsv').toString().trim().split('\n').forEach(function (line) { //First read tags
   var columns = line.replace(/(\r\n|\n|\r)/gm,"").split('\t')
   if(columns[0]) {
     parent = columns[0]
     output += ' { "group": 8, "text":['+JSON.stringify(parent)+'], "tags":['+JSON.stringify(parent)+'] },'
     }
   if(columns[1]) { child = columns[1]
     output += ' { "group": 4, "text":['+JSON.stringify(child)+'], "tags":['+JSON.stringify(parent)+'] }, '
     }
   if(columns[2]) { grandchild = columns[2]
     output += ' { "group": 2, "text":['+JSON.stringify(grandchild)+'], "tags":['+JSON.stringify(child)+'] }, '
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
    dataPoints += '{"group": 1, "text":['+JSON.stringify(columns[2])+'], "references":['+referenceStr+'], "year": "'+columns[1]+'",  "tags":['+(tags[i])+']},'
    }
  })

output += dataPoints+'          ] '
output = output.replace(/,(?=[^,]*$)/, '')

var x = JSON.parse(output); //Have to parse to use in JS, to remove duplicates.

var parentNodes = x.filter(function(node){
    return (node.group == 8);
})
var childNodes = x.filter(function(node){
    return (node.group == 4);
})
var gChildNodes = x.filter(function(node){
    return (node.group == 2);
})
var dataNodes = x.filter(function(node){
    return (node.group == 1);
})
var group0 = x.filter(function(node){
    return (node.group == 0);
})

parentNodes = merge(parentNodes)
childNodes = merge(childNodes)
gChildNodes = merge(gChildNodes)

fs.readFileSync('./Data/Digital Profile - Bibliography.tsv').toString().trim().split('\n').forEach(function(line) {
  var columns = line.replace(/(\r\n|\n|\r)/gm,"").split('\t')

  for (var i = 0; i < dataNodes.length; i++) {
    for (var j = 0; j < dataNodes[i].references.length; j++) {
      if(columns[0] == dataNodes[i].references[j].number){
          dataNodes[i].references[j].text = columns[1]
      }
    }
  }
})
var centralNode = createCentralNode(parentNodes)
output = JSON.stringify(group0.concat(centralNode, parentNodes, childNodes, gChildNodes, dataNodes)); // an array of the nodes and datapoints.

// This is the final output, a string JSON-like string
output = 'var output = { "nodes": '+output+' , "links": '+JSON.stringify(createLinks(output)) +'}'

function createCentralNode(tagNodes) {
  var DigitalPeople = { group: 10, text: ['Digital People']}
  var tags = []
  var flattened = []
  for (var i = 0; i < tagNodes.length; i++) {
    if(tagNodes[i].group == 8){
      tags.push(tagNodes[i].text)
    }
  }
  for(var i = 0; i < tags.length; i++) {
    flattened = flattened.concat(tags[i]);
  }
  DigitalPeople.tags = flattened
  return DigitalPeople
}

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


fs.appendFileSync("./Data/output.js", output);
