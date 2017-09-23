import * as d3 from 'd3';
import { hoverNode, leaveNode } from './iceLayout.js';
let clickHead = '';
let selectedId = 'none';
let content = null;
const update = (svg, conf, indice, data, tableHead, displayHead, clientHeight, clickcb) => {
  svg.selectAll('*').remove();
  render(svg, indice, data, conf, tableHead);
  renderHead(svg, conf, tableHead, displayHead);
  tableheadInteraction(svg, conf, data, tableHead, displayHead, clientHeight, clickcb);
  tableContentInteraction(svg, conf, data, tableHead, clickcb);
};
const renderHead = (svg, conf, tableHead, displayHead) => {
  if (svg.selectAll('.tableHead').empty()) {
    svg.append('g').classed('tableHead', true);
  }
  svg.select('.tableHead')
    .selectAll('.th')
    .data(tableHead)
    .enter()
    .append('rect')
    .classed('th', true)
    .attr('width', conf.rectWidth)
    .attr('height', conf.rectHeight).attr('y', 0)
    .attr('x', function (d, i) {
      return i * conf.rectWidth;
    });
  svg.select('.tableHead')
    .selectAll('text')
    .data(tableHead)
    .enter()
    .append('text').text(function (d, i) { return displayHead[i]; })
    .attr('font-size', 16).attr('x', function (d, i) { return (i + 0.5) * conf.rectWidth; })
    .attr('y', conf.rectHeight * 0.5)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style({ 'cursor': 'default', 'font-weight': 'bold' });
};
const render = (svg, indice, data, conf, tableHead) => {
  let data_ = [];
  let n = 200;
  if (data.length < n) n = data.length;
  let xScale = d3.range(tableHead.length).map(function (d, i) {
    return d3.scaleLinear().range([0, conf.rectWidth - 2]);
  });
  tableHead.map(function (attr, i) {
    let tmp = indice.map(function (i) { return data[i][attr]; });
    if (i !== 0) {
      xScale[i].domain([d3.min(tmp).toFixed(2), d3.max(tmp).toFixed(2)]);
      tmp = tmp.slice(0, n);
    } else {
      xScale[i].range([0, 0]);
    }
    data_ = data_.concat(tmp);
  });
  data_ = data_.map(function (d) {
    if (typeof (d) === 'number') {
      if (Math.floor(d) !== d) return d.toFixed(2);
    }
    return d;
  });
  if (svg.selectAll('.tableContent').empty()) {
    svg = svg.append('g').classed('tableContent', true);
  } else {
    svg = svg.select('.tableContent');
  }
  svg.selectAll('.td')
    .data(data_)
    .enter()
    .append('rect')
    .classed('td', true)
    .classed('td-odd', function (d, i) {
      i %= n;
      i %= 2;
      return !i;
    })
    .classed('td-even', function (d, i) {
      i %= n;
      i %= 2;
      return i;
    })
    .classed('td-select', function (d, i) {
      i %= n;
      if (data_[i] === selectedId) return true;
      return false;
    })
    .attr('width', conf.rectWidth - 2).attr('height', conf.rectHeight - 2)
    .attr('x', function (d, i) {
      i = Math.floor(i / n);
      return 1 + i * conf.rectWidth;
    })
    .attr('y', function (d, i) {
      i %= n;
      return 1 + (i + 1) * conf.rectHeight;
    })
    .attr('stroke-width', 1);
  svg.selectAll('.bg')
    .data(data_)
    .enter()
    .append('rect')
    .classed('bg', true)
    .attr('width', function (d, i) {
      i = Math.floor(i / n);
      if (d && xScale[i]) return Math.min(xScale[i](d), xScale[i].range()[1]);
      return 0;
    })
    .attr('height', conf.rectHeight - 2)
    .attr('x', function (d, i) {
      i = Math.floor(i / n);
      return 1 + i * conf.rectWidth;
    })
    .attr('y', function (d, i) {
      i %= n;
      return 1 + (i + 1) * conf.rectHeight;
    });
  svg.selectAll('text')
    .data(data_)
    .enter()
    .append('text').text(function (d, i) { if (i < n) return '5300' + d; return d; })
    .attr('font-size', 12)
    .attr('x', function (d, i) {
      i = Math.floor(i / n);
      return (i + 0.5) * conf.rectWidth;
    })
    .attr('y', function (d, i) {
      i %= n;
      return (i + 1.5) * conf.rectHeight;
    })
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle');
};
const tableheadInteraction = (svg, conf, data, tableHead, displayHead, clientHeight, clickcb) => {
  let collection = svg.select('.tableHead');
  collection.selectAll('.th').on('click', click)
  .on('mousedown', mousedown).on('mouseup', mouseup);
  collection.selectAll('text').on('click', click)
  .on('mousedown', mousedown).on('mouseup', mouseup);
  let indice = d3.range(data.length).map(function (d, i) { return i; });
  function click (d, i) {
    if (clickHead !== d) {
      indice.sort(function (a, b) {
        return data[b][d] - data[a][d];
      });
      clickHead = d;
    } else {
      indice.sort(function (a, b) {
        return data[a][d] - data[b][d];
      });
      clickHead = '';
    }
    update(svg, conf, indice, data, tableHead, displayHead, clientHeight, clickcb);
  }
  function mousedown (d, i) {
    collection.selectAll('.th').classed('th-click', function (d, i_) {
      if (i_ === i) return true;
      return false;
    });
  }
  function mouseup (d, i) {
    collection.selectAll('.th').classed('th-click', false);
  }
};

let hoverName = null;
const tableContentInteraction = (svg, conf, data, tableHead, clickcb) => {
  let collection = svg.select('.tableContent');
  content = svg.select('.tableContent');
  let n = collection.selectAll('.td').data().length / tableHead.length;
  collection.selectAll('.td').on('mouseover', mouseover);
  // collection.selectAll('.td').on('mouseout', mouseout);
  collection.selectAll('.td').on('click', click);
  collection.selectAll('.td').on('dblclick', dblclick);
  collection.selectAll('.bg').on('mouseover', mouseover);
  // collection.selectAll('.bg').on('mouseout', mouseout);
  collection.selectAll('.bg').on('click', click);
  collection.selectAll('.bg').on('dblclick', dblclick);
  collection.selectAll('text').on('mouseover', mouseover);
  // collection.selectAll('text').on('mouseout', mouseout);
  collection.selectAll('text').on('click', click);
  collection.selectAll('text').on('dblclick', dblclick);
  function mouseover (d, i) {
    /* let indice = i % n;
    let id = collection.selectAll('text').data()[indice];
    if (id === selectedId) {
      return;
    }
    collection.selectAll('.td').each(function (d, i) {
      if (i % n === indice && !d3.select(this).classed('td-select')) {
        d3.select(this).classed('td-over', true);
      }
    });
    nameSet.clear();
    hoverName = id;
    for (let i = 0; i < originData.length; i++) {
      let root = originData[i];
      depth = 1;
      root.children.forEach(findName);
    }
    hoverNode(nameSet); */
  }
  /* function mouseout (d, i) {
    let indice = i % n;
    let id = collection.selectAll('text').data()[indice];
    if (id === selectedId) return;
    leaveNode();
    collection.selectAll('.td').each(function (d, i) {
      if (i % n === indice && !d3.select(this).classed('td-select')) {
        d3.select(this).classed('td-over', false);
      }
    });
  } */
  function click (d, i) {
    leaveNode();
    let indice = i % n;
    let id = collection.selectAll('text').data()[indice];
    if (id === selectedId) {
      return;
    }
    collection.selectAll('.td').each(function (d, i) {
      if (i % n === indice && !d3.select(this).classed('td-select')) {
        d3.select(this).classed('td-over', true);
      } else {
        d3.select(this).classed('td-over', false);
      }
    });
    nameSet.clear();
    hoverName = id;
    for (let i = 0; i < originData.length; i++) {
      let root = originData[i];
      depth = 1;
      root.children.forEach(findName);
    }
    hoverNode(nameSet);
  }
  function dblclick (d, i) {
    let indice = i % n;
    let id = collection.selectAll('text').data()[indice];
    selectedId = id;
    collection.selectAll('.td').each(function (d, i) {
      if (i % n === indice) {
        d3.select(this).classed('td-select', true);
        d3.select(this).classed('td-over', false);
      } else d3.select(this).classed('td-select', false);
    });
    if (clickcb) clickcb(id);
  }
};
let renderData;
let map = {};
let cnt = 0;
const dealData = (d) => {
  if (d.children) {
    let id = d.children[0].name.split(':')[0] + ':' + d.children[0].name.split(':')[1];
    if (map[id] === undefined) {
      map[id] = cnt++;
      renderData[map[id]] = {};
      renderData[map[id]].ID = id;
      renderData[map[id]].consumption = d.precision2;
      renderData[map[id]].cwbs = d.recall2;
      renderData[map[id]].degree = d.precision1;
      renderData[map[id]].role = 1;
    } else {
      renderData[map[id]].consumption = (renderData[map[id]].consumption + d.precision2) / 2;
      renderData[map[id]].cwbs = (renderData[map[id]].cwbs + d.recall2) / 2;
      renderData[map[id]].degree = (renderData[map[id]].degree + d.precision1) / 2;
      renderData[map[id]].role += 1;
    }
    d.children.forEach(dealData);
  }
};

let nameSet = new Set();
let originData = null;
let depth = 0;
const findName = (d) => {
  d.depth = depth;
  if (d.children) {
    let id = d.children[0].name.split(':')[0] + ':' + d.children[0].name.split(':')[1];
    if (id === hoverName) {
      nameSet.add(d);
    }
    depth += 1;
    d.children.forEach(findName);
    depth -= 1;
  }
};

export const highlight = (d) => {
  console.log(d);
  if (content === null || d.data.children === undefined) {
    return;
  }
  let temp = d.data.children[0].name.split(':');
  let attrId = temp[0] + ':' + temp[1];
  let dataSet = content.selectAll('text').data();
  let n = dataSet.length / 5;
  let indice = -1;
  for (let i = 0; i < dataSet.length; i++) {
    if (dataSet[i].indexOf(attrId) !== -1) {
      indice = i % n;
      break;
    }
  }
  if (indice === -1) {
    return;
  }
  content.selectAll('.td').each(function (d, i) {
    if (i % n === indice && !d3.select(this).classed('td-select')) {
      d3.select(this).classed('td-over', true);
    }
  });
};

export const lowlight = () => {
  if (content !== null) {
    content.selectAll('.td').classed('td-over', false);
  }
};

export const attrInit = (data) => {
  console.log(data);
  originData = data;
  const svg = d3.select('#attrInfo');
  svg.attr('height', 10000);
  map = {};
  cnt = 0;
  svg.selectAll('g').remove();
  renderData = [];
  for (let i = 0; i < data.length; i++) {
    let root = data[i];
    root.children.forEach(dealData);
  }
  let tableHead = ['ID', 'consumption', 'cwbs', 'degree', 'role'];
  let displayHead = ['Id', 'prec', 'recall', 'entropy', 'freq'];
  let clientHeight = parseInt(svg.style('height'));
  let clientWidth = parseInt(svg.style('width'));
  let conf = { width: clientWidth, height: clientHeight, padding: 0, rectHeight: 30 };
  conf.rectWidth = conf.width / tableHead.length;
  let indice = renderData.map(function (d, i) { return i; });
  update(svg, conf, indice, renderData, tableHead, displayHead, clientHeight);
};
