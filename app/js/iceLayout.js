import $ from 'jquery';
import * as d3 from 'd3';
import { pathInfoInit } from './treePath.js';
import { UserInfoInit } from './UserInfoLayout.js';
import { Details2 } from './Details2.js';
import { attrInit, highlight, lowlight } from './attrLayout.js';
import __ from './config.js';

const margin = {top: 1, bottom: 1, left: 5, right: 5};
const padding = {top: 1, bottom: 1, left: 5, right: 5};
let attrName = ['5300000', '5300005', '5300015', '5300025', '5300040', '5300045', '5300100', '5300105', '5300110', '5300115', '5300200', '5300201', '5300202', '5300220', '5300230', '5300450', '5300470', '5300582'];
let widthInBrush, widthInBox, treeIndexInBrush, treeIndexInBoxRight, treeIndexInBoxMid, treeCntInBox, treeCnt, scaleSmall, scaleLarge, brush;
const iceData = {};

const processIce = data => {
  let obj = {};// ，时间对应的树结构
  const deal = (objQuote, name, dataQuote) => {
    objQuote.name = name;
    objQuote.size = dataQuote.count;
    objQuote.id = dataQuote.id;
    objQuote.precision1 = dataQuote['class 1 precision'];
    objQuote.precision2 = dataQuote['class 2 precision'];
    objQuote.recall1 = dataQuote['class 1 recall'];
    objQuote.recall2 = dataQuote['class 2 recall'];
    if (dataQuote.hasOwnProperty('children')) {
      objQuote.children = [];
      let splitValue = dataQuote['children'].splitValue;
      Object.keys(dataQuote['children']).forEach(key => {
        if (key === 'splitValue') return;
        let eventId = key.split(':')[0];
        deal(objQuote.children[objQuote.children.length] = {}, attrName[eventId].slice(-3) + ':' + splitValue.toFixed(1) + ':' + key.split(':')[1], dataQuote['children'][key]);
      });
    }
  };
  Object.keys(data).forEach(key => {
    obj[key] = {};
    deal(obj[key], Object.keys(data[key])[2], Object.values(data[key])[2]); // 存的地方，key values;
  });
  return obj;
};

const layoutIce = (data, svg) => {
  const rectPadding = 0;
  const node = $(svg.node());
  let height = parseInt(node.height()) - margin.top - margin.bottom - padding.top - padding.bottom;
  widthInBrush = (parseInt(+node.width() - margin.left - margin.right)) / Object.keys(data).length;
  let width = (parseInt(+node.width() - margin.left - margin.right)) / Object.keys(data).length - padding.left - padding.right;
  treeCnt = Object.keys(data).length;

  let partition = d3.partition()
      .size([height, width])
      .padding(rectPadding);

  let obj = {};

  Object.keys(data).forEach(time => {
    let dataT = d3.hierarchy(data[time]).sum(d => d.children ? 0 : d.size);
    obj[time] = partition(dataT);
  });

  let time = Object.keys(obj);
  let timeArr = time.map(d => obj[d]); // 每个时间的数据;
  let line = {};
  let per = obj[time[0]].descendants();// 前一年数据;
  let perYear = time[0];// 前一年;

  time.forEach((d, i) => {
    let nodes = obj[time[i]].descendants(); // 当年数据;
    if (i) {
      nodes.forEach((data, i) => {
        per.forEach(dataPer => {
          let equal = true;
          let left = data;
          let right = dataPer;
          while (true) {
            if (!left && !right) break;
            else if (!left || !right) {
              equal = false;
              break;
            } else if (left.data.name !== right.data.name) {
              equal = false;
              break;
            }
            left = left.parent;
            right = right.parent;
          }
          if (equal) {
            if (!line.hasOwnProperty(perYear)) {
              line[perYear] = [];
            }
            line[perYear].push({
              name: data.data.name,
              depth: dataPer.depth,
              x0: dataPer.y1,
              y0: dataPer.x1 - (dataPer.x1 - dataPer.x0) / 2,
              x1: data.y0,
              y1: data.x1 - (data.x1 - data.x0) / 2
            });
          }
        });
      });
    }
    per = nodes;
    perYear = time[i];
  });
  return {data: obj, time: time, timeArr: timeArr, line: line};
};

const renderIce = (layoutData, svg, width, offset) => {
  let data = layoutData.data;
  let time = layoutData.time;
  let timeArr = layoutData.timeArr;
  width = (parseInt(width) - margin.left - margin.right) / Object.keys(data).length;
  let id = svg.attr('id');
  let ice = svg.selectAll('#' + `${id}iceDom`).data([1]).enter().append('g').attr('id', `${id}iceDom`);
  let iceTimeG = ice.selectAll('.iceTimeg')
      .data(timeArr, (d, i) => time[i]);
  let iceTimeDom = iceTimeG.enter()
    .append('g')
    .attr('class', 'iceTimeg')
    .attr('year', (d, i) => time[i]);
  iceTimeG.exit().remove();
  iceTimeDom.each(function (d, i) {
    let g = d3.select(this);
    let data = d.descendants();
    let iceG = g.selectAll('.iceeach')
      .data(data, d => d.data.name);
    let iceDom = iceG.enter()
      .append('rect')
      .attr('class', 'iceeach')
      .attr('x', d => d.y0 + i * width)
      .attr('y', d => d.x0)
      .attr('width', d => d.y1 - d.y0)
      .attr('height', d => d.x1 - d.x0)
      .attr('fill', '#ddd')
      .attr('iceName', d => d.data.name)
      .attr('depth', d => d.depth)
      .attr('treeIndex', i)
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5);
    iceDom.exit().remove();
  });
};

const renderLine = (line, svg) => {
  // let width = (parseInt($(svg.node()).width()) - margin.left - margin.right) / (Object.keys(line).length + 1);
  svg.select('#svgLine').remove();
  let svgLineG = svg.append('g').attr('id', 'svgLine');

  svg.selectAll('.iceTimeg').each(function (x, i) { // 第几个year的line G
    let svgg = svgLineG.append('g');
    let g = d3.select(this);
    let year = g.attr('year');
    if (line.hasOwnProperty(year)) {
      let lineData = line[year];
      let iceLineG = svgg.selectAll('.iceline')
        .data(lineData);
      let iceLineDom = iceLineG.enter()
        .append('path')
        .attr('class', 'iceline')
        .attr('treeIndex', i)
        .attr('iceName', d => d.name)
        .attr('depth', d => d.depth)
        .style('fill', 'none')
        .style('stroke', 'red')
        .style('display', 'none')
        .attr('d', function (d) {
          let treeIndex = parseInt(this.getAttribute('treeIndex'));
          if (!(treeIndex >= treeIndexInBrush && treeIndex < treeIndexInBrush + treeCntInBox - 1)) return null;
          let x0 = calcX(treeIndex, d.x0);
          let y0 = d.y0;
          let x1 = calcX(treeIndex + 1, d.x1);
          let y1 = d.y1;
          let z = (x1 - x0) / 2;
          let s = `M${x0}, ${y0} Q ${x0 + z}, ${y0} ${x1 - z}, ${y1} ${x1}, ${y1}`;
          return s;
        });
      iceLineDom.exit().remove();
    }
  });
};
const renderBrush = (svg, svgLarge, dealData) => {
  let height = parseInt($(svg.node()).height()) - margin.top - margin.bottom - padding.top - padding.bottom;
  let width = parseInt($(svg.node()).width() - margin.left - margin.right);
  let edgeGroup = svg.append('g')
    .attr('id', 'edgeGroup');
  brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on('brush end', function () {
      let s = d3.event.selection;
      scaleSmall = scaleLarge = 1;
      treeIndexInBrush = treeIndexInBoxRight = treeIndexInBoxMid = treeCntInBox = 9999999;
      /* if (s[1] - s[0] !== lastSelection[1] - lastSelection[0]) {
        brush.move(svg.select('#brushGroup'), lastSelection);
        return;
      } else {
        lastSelection = s;
      } */
      treeCntInBox = parseInt((s[1] - s[0]) / widthInBrush + 1 / 3);
      treeIndexInBrush = parseInt(Math.ceil(s[0] / widthInBrush - 1 / 3)); // 去掉负号

      widthInBox = (parseInt($(svgLarge.node()).width() - margin.left - margin.right)) / (treeCntInBox);
      svgLarge.selectAll('.iceeach')
        .transition()
        .duration(500)
        .attr('x', function (d) {
          let treeIndex = parseInt(this.getAttribute('treeIndex'));
          return calcX(treeIndex, d.y0);
        })
        .attr('width', function (d) {
          let treeIndex = parseInt(this.getAttribute('treeIndex'));
          let width = calcWidth(treeIndex, d.y1 - d.y0);
          return width;
        });

      svgLarge.selectAll('.iceline')
        .attr('d', function (d) {
          let treeIndex = parseInt(this.getAttribute('treeIndex'));
          if (!(treeIndex >= treeIndexInBrush && treeIndex < treeIndexInBrush + treeCntInBox - 1)) return null;
          let x0 = calcX(treeIndex, d.x0);
          let y0 = d.y0;
          let x1 = calcX(treeIndex + 1, d.x1);
          let y1 = d.y1;
          let z = (x1 - x0) / 2;
          let s = `M${x0}, ${y0} C ${x0 + z}, ${y0} ${x1 - z}, ${y1} ${x1}, ${y1}`;
          return s;
        });

      let edgeWidth = 6;
      svg.selectAll('.brushEdge').remove();
      console.log($('.selection')[0]);
      let x1 = parseInt($('.selection')[0].attributes.x.value);
      let x2 = parseInt($('.selection')[0].attributes.width.value) + x1 - edgeWidth;
      edgeGroup.append('rect')
        .attr('class', 'brushEdge')
        .attr('x', x1)
        .attr('y', 0)
        .attr('width', edgeWidth)
        .attr('height', height)
        .attr('fill', '#6b605e');
      edgeGroup.append('rect')
        .attr('class', 'brushEdge')
        .attr('x', x2)
        .attr('y', 0)
        .attr('width', edgeWidth)
        .attr('height', height)
        .attr('fill', '#6b605e');
      let enLarge = d3.select('#enLarge');
      enLarge.selectAll('.enlargeSymbol').remove();
      svg.selectAll('#iniceSmalliceDom rect')
        .attr('fill', '#ddd');
    });

  svg.append('g')
    .attr('id', 'brushGroup')
    .attr('class', 'brush')
    .call(brush)
    .call(brush.move, [0, width])
    .selectAll('.selection, .overlay')
    .attr('height', height);
};

let mouseDown = 0;
let mouseP;

const calcOffset = (treeIndex) => {
  const treeLeftOffset = (treeIndexInBoxMid - treeIndexInBrush) * widthInBox * scaleSmall;
  if (treeIndex < treeIndexInBrush) return -1;
  else if (treeIndex < treeIndexInBoxMid) {
    return (treeIndex - treeIndexInBrush + 1 / 3) * widthInBox * scaleSmall;
  } else if (treeIndex < treeIndexInBoxRight) {
    return treeLeftOffset + (treeIndex - treeIndexInBoxMid + 1 / 3) * widthInBox * scaleLarge;
  } else {
    return treeLeftOffset + (treeIndexInBoxRight - treeIndexInBoxMid) * widthInBox * scaleLarge + (treeIndex - treeIndexInBoxRight + 1 / 3) * widthInBox * scaleSmall;
  }
};

const calcX = (treeIndex, x) => {
  if (treeIndex < treeIndexInBrush) {
    return 0;
  } else if (treeIndex >= treeIndexInBrush + treeCntInBox) {
    return 2000;
  } else if (treeIndex < treeIndexInBoxMid) {
    return (x * widthInBox / widthInBrush + (treeIndex - treeIndexInBrush) * widthInBox) * scaleSmall;
  } else if (treeIndex < treeIndexInBoxRight) {
    return (treeIndexInBoxMid - treeIndexInBrush) * widthInBox * scaleSmall + (treeIndex - treeIndexInBoxMid) * widthInBox * scaleLarge + x * widthInBox / widthInBrush * scaleLarge;
  } else {
    return (treeIndexInBoxMid - treeIndexInBrush) * widthInBox * scaleSmall + (treeIndexInBoxRight - treeIndexInBoxMid) * widthInBox * scaleLarge + (treeIndex - treeIndexInBoxRight) * widthInBox * scaleSmall + x * widthInBox / widthInBrush * scaleSmall;
  }
};

const calcWidth = (treeIndex, width) => {
  if (treeIndex < treeIndexInBrush || treeIndex >= treeIndexInBrush + treeCntInBox) return 0;
  else if (treeIndex < treeIndexInBoxMid) return width * widthInBox / widthInBrush * scaleSmall;
  else if (treeIndex < treeIndexInBoxRight) return width * widthInBox / widthInBrush * scaleLarge;
  else return width * widthInBox / widthInBrush * scaleSmall;
};

const addBoxSelection = (svg) => {
  svg.on('mousedown', function () {
    svg.append('rect')
      .attr('class', 'selection-box');
    mouseP = d3.mouse(this);
    mouseDown = 1;
  })
    .on('mousemove', function () {
      let mouseNP = d3.mouse(this);
      if (mouseDown === 1 && Math.abs((mouseNP[1] - mouseP[1]) * (mouseNP[0] - mouseP[0])) > 100) {
        svg.selectAll('.selection-box')
          .attr('x', mouseP[0])
          .attr('y', mouseP[1])
          .attr('width', mouseNP[0] - mouseP[0])
          .attr('height', mouseNP[1] - mouseP[1]);
      }
    })
    .on('mouseup', function () {
      let mouseNP = d3.mouse(this); // mouse current postion
      mouseDown = 0;
      svg.selectAll('.selection-box').remove();
      if (Math.abs((mouseNP[1] - mouseP[1]) * (mouseNP[0] - mouseP[0])) <= 100) return; // 去抖
      let left = Math.min(mouseNP[0], mouseP[0]);
      let right = Math.max(mouseNP[0], mouseP[0]);
      let cnt = -1;
      let cntLeft = 99999;
      for (let i = 0; i < treeCnt; i++) {
        let offset = calcOffset(i);
        if (offset >= left && offset <= right) {
          cnt = Math.max(cnt, i);
          cntLeft = Math.min(cntLeft, i);
        }
      }
      if (cnt === -1) return;
      cnt = cnt + 1;
      treeIndexInBoxMid = cntLeft;
      treeIndexInBoxRight = cnt;
      let tableData = [];
      for (let i = treeIndexInBoxMid; i < treeIndexInBoxRight; i++) {
        tableData[i - treeIndexInBoxMid] = iceData.dealData[i];
      }
      attrInit(tableData);
      cnt = treeIndexInBoxRight - treeIndexInBoxMid;
      scaleLarge = Math.sqrt(treeCntInBox / cnt);
      scaleSmall = scaleLarge === 1 ? 1 : (treeCntInBox - scaleLarge * cnt) / (treeCntInBox - cnt);
      svg.selectAll('.iceeach')
        .transition()
        .duration(500)
        .attr('x', function (d) {
          let treeIndex = parseInt(this.getAttribute('treeIndex'));
          return calcX(treeIndex, d.y0);
        })
        .attr('width', function (d) {
          let treeIndex = parseInt(this.getAttribute('treeIndex'));
          return calcWidth(treeIndex, d.y1 - d.y0);
        });
      svg.selectAll('.iceline')
        .attr('d', function (d) {
          let treeIndex = parseInt(this.getAttribute('treeIndex'));
          if (!(treeIndex >= treeIndexInBrush && treeIndex < treeIndexInBrush + treeCntInBox - 1)) return null;
          let x0 = calcX(treeIndex, d.x0);
          let y0 = d.y0;
          let x1 = calcX(treeIndex + 1, d.x1);
          let y1 = d.y1;
          let z = (x1 - x0) / 2;
          let s = `M${x0}, ${y0} C ${x0 + z}, ${y0} ${x1 - z}, ${y1} ${x1}, ${y1}`;
          return s;
        });
      let enLarge = d3.select('#enLarge');
      enLarge.selectAll('.enlargeSymbol').remove();
      for (let i = treeIndexInBoxMid; i < treeIndexInBoxRight; i++) {
        let x = calcOffset(i);
        enLarge.append('circle')
          .attr('class', 'enlargeSymbol')
          .attr('cx', x)
          .attr('cy', 1)
          .attr('r', 6)
          .attr('fill', '#c53033')
          .style('stroke', '#fff')
          .style('stroke-width', 4);
      }
      let svgSmall = d3.select('#iniceSmall');
      svgSmall.selectAll('#iniceSmalliceDom rect')
        .attr('fill', function (d) {
          let treeIndex = parseInt(this.getAttribute('treeIndex'));
          if (treeIndex >= treeIndexInBoxMid && treeIndex < treeIndexInBoxRight) {
            return '#b4a19d';
          } else {
            return '#ddd';
          }
        });
    });
};

let light = {};
const addEventIce = (svg) => {
  // hover rect的联动效果
  d3.selectAll('.iceeach').on('mouseover', function (d) {
    highlight(d);
    let target = d3.select(d3.event.target);
    let iceName = target.attr('iceName');
    let depth = target.attr('depth');
    light.rect = svg.selectAll(`[iceName='${iceName}']`);
    light.rect.attr('fill', 'grey');
    light.line = svg.selectAll(`.iceline[iceName='${iceName}']`);
    light.line.style('display', 'inline')
      .style('stroke', function (d) {
        let g = d3.select(this);
        if (g.attr('depth') === depth) {
          return 'red';
        }
        return 'red';
      });
    // svg.selectAll(`.iceline[iceName='${iceName}'][depth='${depth}']`).style('stroke', 'yellow')
    if (mouseDown === 0) {
      $('.tooltip').text(iceName)
        .css('left', (d3.event.pageX - 240) + 'px')
        .css('top', (d3.event.pageY - 50) + 'px')
        .css('opacity', 0.8);
    }
  })
    .on('mouseout', () => {
      lowlight();
      light.rect.attr('fill', '#ddd');

      light.line.style('display', 'none').style('stroke', 'red');
      $('.tooltip').css('opacity', '0')
      .css('left', 0 + 'px')
      .css('top', 0 + 'px');
    })
    .on('mousedown', function () {
      // $(document).bind('contextmenu', e => false);
      // event.preventDefault();
      if (event.button === 2) {
        renderRader(100, 100, 80, 3, [[10, 60], [40, 40]]);
      }
    })
    .on('click', function (d) {
      if (event.shiftKey) {
        let treeIndex = parseInt(this.getAttribute('treeIndex'));
        pathInfoInit([iceData.dealData[treeIndex]], d.data.name);
        return;
      }
      let treeIndex = parseInt(this.getAttribute('treeIndex'));
      $.get(`${__.URL}/node`, {
        _id: iceData.orignData[treeIndex]._id,
        treeId: iceData.orignData[treeIndex].treeId,
        nodeId: d.data.id
      }, data1 => {
        UserInfoInit(data1[0], data1[1]);
        Details2(data1[0]);
      });
    });
};

const renderlLineChart = (data) => {
  let svg = d3.select('#performance');
  let lineChart = svg.append('g')
    .attr('class', 'lineChart')
    .attr('transform', 'translate(' + widthInBrush / 3 + ',' + 0 + ')');
  let height = $(svg.node()).height() - 8;
  let width = $(svg.node()).width() - 10 - widthInBrush;

  let xScale = d3.scaleLinear()
    .domain([0, data.length - 1])
    .range([0, width]);

  let maxValue = d3.max(data);
  let minValue = d3.min(data);

  let yScale = d3.scaleLinear()
    .domain([minValue - 0.02, maxValue + 0.02])
    .range([height, 0]);

  d3.axisBottom()
    .scale(xScale)
    .ticks(data.length);

  let area = d3.area()
    .x(function (d, i) {
      return xScale(i);
    })
    .y1(function (d) {
      return yScale(d);
    })
    .y0(height)
    .curve(d3.curveCardinal.tension(0.25));
    // console.log(area(data));

  var mainColor = '#c53033';
  var a = d3.rgb(220, 106, 97);
  var b = d3.rgb(255, 255, 255);
  var defs = svg.append('defs');
  var linearGradient = defs.append('linearGradient')
                          .attr('id', 'linearColor')
                          .attr('x1', '0%')
                          .attr('y1', '0%')
                          .attr('x2', '0%')
                          .attr('y2', '100%');
  linearGradient.append('stop')
                  .attr('offset', '0%')
                  .style('stop-color', a.toString());

  linearGradient.append('stop')
                  .attr('offset', '100%')
                  .style('stop-color', b.toString());

  let lineGroup = lineChart.append('g');

  // dying under line segements
  lineGroup.append('path')
    .attr('d', area(data))
    .style('fill', 'url(#' + linearGradient.attr('id') + ')')
    .style('stroke-opacity', 0.9);

  // line segements between points
  lineGroup.append('path')
    .attr('d', function (d) {
      let x = area(data);
      let l = x.indexOf('L') === -1 ? x.length : x.indexOf('L');
      return x.substr(0, l);
    })
    // .style('fill', 'url(#' + linearGradient.attr('id') + ')')
    .style('fill-opacity', 0)
    .style('stroke', mainColor)
    .style('stroke-width', 2);

  lineGroup.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', function (d, i) {
      return xScale(i);
    })
    .attr('cy', function (d) {
      return yScale(d);
    })
    .attr('r', 4)
    .attr('fill', mainColor)
    .style('stroke', '#fff')
    .style('stroke-width', 1)
    .on('mouseover', function (d) {
      // let x = d3.event.pageX > 1350 ? 1350 : d3.event.pageX
      console.log((d3.event.pageX - 240));
      $('.tooltip').text(d)
        .css('left', (d3.event.pageX - 240) + 'px')
        .css('top', (d3.event.pageY - 60) + 'px')
        .css('opacity', 0.8);
    })
    .on('mouseout', function () {
      $('.tooltip').css('opacity', '0')
      .css('left', 0 + 'px')
      .css('top', 0 + 'px');
    });
};

const renderRader = (positionX, positionY, r, cnt, data) => {
  let rEach = r / cnt;
  let pieData = [100, 3];
  d3.select('.rader').remove();
  let scale = d3.scaleLinear().domain([0, 100]).range([0, 2.2]);
  let scaleR = d3.scaleLinear().domain([0, 100]).range([0, r]);
  let raderMove = 0;
  let pie = d3.pie(pieData);
  let raderGroup = d3.select('#inice')
    .append('g')
    .attr('class', 'rader')
    .attr('transform', 'translate(' + positionX + ',' + positionY + ')')
    .on('click', function () {
      raderMove = 1 - raderMove;
    })
    .on('mousemove', function () {
      if (raderMove === 1) {
        d3.select(this).attr('transform', 'translate(' + (d3.event.x - 265) + ',' + (d3.event.y - 65) + ')');
      }
    });
  for (let i = 0; i < cnt; i++) {
    let r = rEach * i;
    let arc = d3.arc()
            .outerRadius(rEach + r)
            .innerRadius(r)
            .startAngle(d => d.startAngle + Math.PI * pieData[1] / (pieData[0] + pieData[1]));
    let arcs = raderGroup.selectAll('g.arc' + i)
            .data(pie(pieData))
            .enter()
            .append('g')
            .attr('class', 'arc' + i);
    arcs.append('path')
            .attr('fill', '#F2F2F2')
            .attr('stroke', '#DDDDDD')
            .attr('stroke-width', 1)
            .attr('opacity', function (d, i) {
              if (i === 0) {
                return 1;
              } else {
                return 0;
              }
            })
            .attr('d', arc);
    for (let i = 0; i < data.length; i++) {
      let pR = scaleR(data[i][1]);
      let angle = scale(data[i][0]);
      let x = Math.sin(angle) * pR;
      let y = Math.cos(angle) * pR;
      raderGroup.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 2)
        .attr('fill', 'red');
    }
  }
};

export const hoverNode = (ids) => {
  ids.forEach(function (d) {
    let iceName = d.name;
    let depth = d.depth;
    light.rect = d3.selectAll(`[iceName='${iceName}']`);
    light.rect.attr('fill', 'grey');
    light.line = d3.selectAll(`.iceline[iceName='${iceName}']`);
    light.line.style('display', 'inline')
      .style('stroke', function (d) {
        let g = d3.select(this);
        if (g.attr('depth') === depth) {
          return 'red';
        }
        return 'red';
      });
  });
};

export const leaveNode = () => {
  d3.selectAll('.iceeach').attr('fill', '#ddd');
  d3.selectAll('.iceline').style('display', 'none').style('stroke', 'red');
};

export const focusOneTree = (timeIndex, id) => {
  $.get(`${__.URL}/treeandnodebylevel`, {
    level: timeIndex,
    usrId: id
  }, data => {
    let treeData = processIce([data[0]]);
    pathInfoInit([treeData[0]], data[1]);
  });
};

export const displayTrees = (timeIndex, attr) => {
  $.get(`${__.URL}/treebylevel`, {
    level: timeIndex
  }, data => {
    let left = data[0] * widthInBrush;
    let right = (data[data.length - 1] + 1) * widthInBrush;
    d3.select('#iniceSmall #brushGroup').call(brush.move, [left, right]);
    let displayData = [];
    for (let i = 0; i < data.length; i++) {
      displayData[i] = iceData.dealData[data[i]];
    }
    pathInfoInit(displayData, attr);
  });
};

export const iceRerender = (data) => {
  const svg = d3.select('#inice');
  const svgSmall = d3.select('#iniceSmall');
  const lineChart = d3.select('#performance');
  svg.selectAll('g').remove();
  svgSmall.selectAll('g').remove();
  lineChart.selectAll('g').remove();
  let lTreeIndex = treeIndexInBrush;
  let rTreeIndex = treeIndexInBrush + treeCntInBox;
  iceInit(data);
  svgSmall.select('#brushGroup')
    .call(brush.move, [widthInBrush * lTreeIndex, widthInBrush * rTreeIndex]);
};

export const iceInit = (data) => {
  const svg = d3.select('#inice');
  const svgSmall = d3.select('#iniceSmall');
  iceData.orignData = data;
  iceData.dealData = processIce(iceData.orignData);
  iceData.layoutData = layoutIce(iceData.dealData, svg);
  iceData.layoutDataSmall = layoutIce(iceData.dealData, svgSmall);
  renderIce(iceData.layoutData, svg, $(svg.node()).width(), 0);
  renderIce(iceData.layoutDataSmall, svgSmall, $(svgSmall.node()).width(), 0);
  renderLine(iceData.layoutData.line, svg);
  renderLine(iceData.layoutDataSmall.line, svgSmall);
  renderBrush(svgSmall, svg, iceData.dealData);
  addEventIce(svg);
  addBoxSelection(svg);
  let precison = [];
  for (let eachTreeData in iceData.dealData) {
    precison[precison.length] = iceData.dealData[eachTreeData].precision2;
  }
  renderlLineChart(precison);
  return iceData;
};
