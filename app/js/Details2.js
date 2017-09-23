import $ from 'jquery';
import * as d3 from 'd3';
import __ from './config.js';

const _d = { // defaults
  cellWidth: 90,
  cellHeight: 40,
  cellMargin: 2,
  textWidth: 70,
  barPadding: 5
};

const process = (d) => {
  const m = 9;
  const n = 18;
  const data = {};
  const len = d.length;

  for (let i = 0; i < n; ++i) {
    data[__.attrName[i]] = { max: -Infinity, min: Infinity };
    for (let j = 0; j < m; ++j) {
      data[__.attrName[i]][`time${j}`] = {};
      data[__.attrName[i]][`time${j}`].type1max = -Infinity;
      data[__.attrName[i]][`time${j}`].type1min = Infinity;
      data[__.attrName[i]][`time${j}`].type2max = -Infinity;
      data[__.attrName[i]][`time${j}`].type2min = Infinity;
      data[__.attrName[i]][`time${j}`].type1 = 0; // 非外挂
      data[__.attrName[i]][`time${j}`].type2 = 0; // 外挂
      data[__.attrName[i]][`time${j}`].color = __.attrColor[__.attrType[__.attrName[i]]];
    }
  }

  d.forEach((time, i) => {
    time.attr.forEach((type, j) => {
      type.forEach((v, k) => {
        if (time.cheatType === 0) { // 0 是非外挂
          data[__.attrName[k]][`time${j}`].type1 += v;
          if (data[__.attrName[k]][`time${j}`].type1max < v) {
            data[__.attrName[k]][`time${j}`].type1max = v;
          }
          if (data[__.attrName[k]][`time${j}`].type1min > v) {
            data[__.attrName[k]][`time${j}`].type1min = v;
          }
        } else {
          data[__.attrName[k]][`time${j}`].type2 += v;
          if (data[__.attrName[k]][`time${j}`].type2max < v) {
            data[__.attrName[k]][`time${j}`].type2max = v;
          }
          if (data[__.attrName[k]][`time${j}`].type2min > v) {
            data[__.attrName[k]][`time${j}`].type2min = v;
          }
        }
      });
    });
  });

  for (let k in data) {
    for (let u in data[k]) {
      if (typeof data[k][u] === 'object') {
        data[k][u].avType1 = data[k][u].type1 / len;
        data[k][u].avType2 = data[k][u].type2 / len;
      }
    }
  }
  for (let kk in data) {
    for (let uu in data[kk]) {
      if (typeof data[kk][uu] === 'object') {
        if (data[kk].max < data[kk][uu].type1max) data[kk].max = data[kk][uu].type1max;
        if (data[kk].max < data[kk][uu].type2max) data[kk].max = data[kk][uu].type2max;
        if (data[kk].min > data[kk][uu].type1min) data[kk].min = data[kk][uu].type1min;
        if (data[kk].min > data[kk][uu].type2min) data[kk].min = data[kk][uu].type2min;
      }
    }
  }
  for (let kkk in data) {
    for (let uuu in data[kkk]) {
      if (typeof data[kkk][uuu] === 'object') {
        data[kkk][uuu].max = data[kkk].max;
        data[kkk][uuu].min = data[kkk].min;
        data[kkk][uuu].extent = data[kkk].max - data[kkk].min;
      }
    }
  }
  for (let kkkk in data) {
    delete data[kkkk].max;
    delete data[kkkk].min;
  }

  return data;
};

function init (data) {
  const div = d3.select('#individual');
  const _keys = Object.keys(data);
  const _data = Object.values(data);
  const svg = div
        .append('svg')
        .attr('id', 'details2Chart')
        .attr('width', _d.textWidth + _d.cellWidth * Object.keys(_data[0]).length)
        .attr('height', (_d.cellMargin + _d.cellHeight) * _data.length)
        .style('background-color', '#f1f1f1');

  // svg
  //   .selectAll('.row-background')
  //   .data(_data)
  //   .enter()
  //   .append('rect')
  //   .attr('class', 'row-background')
  //   .attr('width', _d.cellWidth * _data.length)
  //   .attr('height', _d.cellHeight)
  //   .attr('fill', '#fff')
  //   .attr('transform', (d, i) => `translate(0, ${i * (_d.cellHeight + _d.cellMargin)})`);

  const row = svg
        .selectAll('.row')
        .data(_data)
        .enter()
        .append('g')
        .attr('id', (d, i) => `row-${i}`)
        .attr('class', 'row')
        .attr('transform', (d, i) => `translate(0, ${i * (_d.cellHeight + _d.cellMargin)})`);

  row.append('rect')
    .attr('width', _d.textWidth - _d.cellMargin)
    .attr('height', _d.cellHeight)
    .attr('fill', '#fff');
  row.append('text')
    .text((d, i) => _keys[i])
    .attr('transform', `translate(10, ${_d.cellHeight / 1.5})`);

  row
    .selectAll('.cell')
    .data(d => Object.values(d))
    .enter()
    .append('g')
    .attr('id', (d, i) => `cell-${i}`)
    .attr('idx', (d, i) => i)
    .attr('class', 'cell')
    .attr('width', _d.cellWidth)
    .attr('height', _d.cellHeight)
    .attr('transform', (d, i) => `translate(${_d.textWidth + i * (_d.cellWidth + _d.cellMargin)}, 0)`);

  return svg;
}

function render (data, index) {
  const cell = d3.select(this);
  const _data = [{
    max: data.type1max,
    min: data.type1min,
    v: data.type1
  }, {
    max: data.type2max,
    min: data.type2min,
    v: data.type2
  }];
  const barHeight = _d.cellHeight / 2 - 5;
  const xScale = d3.scaleLinear().range([0, _d.cellWidth]).domain([0, data.extent]);

  cell
    .selectAll('.barBackground')
    .data(_data)
    .enter()
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', _d.cellWidth)
    .attr('height', _d.cellHeight)
    .style('fill', '#fff');

  cell
    .selectAll('.bar')
    .data(_data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.min))
    .attr('y', (d, i) => i * barHeight)
    .attr('width', d => xScale(d.max - d.min))
    .attr('height', barHeight)
    .attr('transform', 'translate(0, 5)')
    .style('stroke', '#fff')
    .style('stroke-width', 1)
    .style('fill', data.color)
    .on('mouseover', function (d) {
      $('.tooltip').text(`[${d.min}, ${d.max}]`)
        .css('left', (d3.event.pageX - 240) + 'px')
        .css('top', (d3.event.pageY - 60) + 'px')
        .css('opacity', 0.8)
        .css('width', '70px')
        .css('z-index', 99);
    })
    .on('mouseout', function () {
      $('.tooltip').css('opacity', '0')
        .css('left', 0 + 'px')
        .css('top', 0 + 'px');
    });
}

export const Details2 = (d) => {
  const data = process(d);
  d3.select('#details2Chart').remove();
  init(data)
    .selectAll('.cell')
    .each(render);
};
