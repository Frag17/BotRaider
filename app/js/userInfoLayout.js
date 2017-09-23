import * as d3 from 'd3';
import $ from 'jquery';
import {focusOneTree, displayTrees} from './iceLayout.js';
import __ from './config.js';

let heightArr = [10, 50];
let width = 400;
let widthPer = 24.6;
let startx = 25;
let padding = 3;
let innerPadding = 2;
let stateCnt = [0, 0, 0];
let state = [];
let chartHeight = 30;
let backgroudColor = ['#F1F1F1', '#999999', '#999999'];
let attrPos = {};
let hightLight = -1;
let renderData;
let circleDrag = 0;
let justDrag = 0;
let expand = [];
let renderJudge;
let dragIndex = -1;
let chartPadding = 15;
let dblclickColor = '#c53033';
const drawOneHistogram = (data, judgeData, index, offset, svg, scaleY, id, scaleY2) => {
  let height = state[index] === 0 ? heightArr[0] : heightArr[1];
  let histogram = svg.append('g')
    .attr('id', index)
    .attr('class', 'histogram')
    .attr('transform', 'translate(' + 0 + ',' + offset + ')');

  histogram.append('circle')
    .attr('cx', startx / 2 - 2)
    .attr('cy', height / 2)
    .attr('r', startx / 4)
    .attr('fill', '#999999')
    .on('click', function () {
      if (justDrag > 10) {
        justDrag = 0;
        return;
      }
      if (state[index] === 0) {
        state[index] = 1;
        stateCnt[0]--;
        stateCnt[1]++;
      } else if (state[index] === 1) {
        state[index] = 0;
        stateCnt[0]++;
        stateCnt[1]--;
      } else {
        state[index] = 0;
        stateCnt[0]++;
        stateCnt[2]--;
        for (let j = 0; j < 18; j++) {
          expand[index][j] = 0;
        }
      }
      renderHistogram(renderData, renderJudge);
    })
    .on('mousedown', function () {
      dragIndex = index;
      circleDrag = 1;
    })
    .on('mousemove', function () {
      if (circleDrag === 1 && dragIndex === index) {
        console.log(d3.event.pageX + ',' + d3.event.pageY);
        let x = d3.event.pageX - 12;
        let y = d3.event.pageY - 735 - offset + $('#details1').scrollTop();
        d3.select(this)
          .attr('cx', x)
          .attr('cy', y);
        justDrag += 1;
      }
    })
    .on('mouseup', function () {
      if (justDrag > 2) {
        let y = d3.event.pageY - 735;
        let indexNow = calcIndex(y);
        if (indexNow !== id) {
          let temp = renderData[id];
          renderData[id] = renderData[indexNow];
          renderData[indexNow] = temp;
          temp = renderJudge[id];
          renderJudge[id] = renderJudge[indexNow];
          renderJudge[indexNow] = temp;
          renderHistogram(renderData, renderJudge);
        }
      }
      circleDrag = 0;
      dragIndex = -1;
    })
    .on('mouseover', function () {
      if (circleDrag === 0) {
        $('#tooltipId').text(renderData[index].usrId)
        .css('left', (d3.event.pageX) + 'px')
        .css('top', (d3.event.pageY - 700) + 'px')
        .css('opacity', 0.8)
        .css('z-index', 99);
      }
    })
    .on('mouseout', () => {
      $('#tooltipId').css('opacity', '0');
    });

  histogram.selectAll('.colorGroup')
    .data(judgeData)
    .enter()
    .append('g')
    .attr('class', 'colorGroup')
    .attr('transform', function (d, i) {
      return 'translate(' + (i * (widthPer * 4 + innerPadding) + startx) + ',' + 0 + ')';
    })
    .append('rect')
    .attr('width', widthPer * 4)
    .attr('height', height)
    .attr('fill', function (d, i) {
      return backgroudColor[d];
    })
    .on('click', function (d, i) {
      focusOneTree(i, renderData[index].usrId);
    });
  if (state[index] === 0) {
    return;
  }
  let timeId = 0;
  histogram.selectAll('.rectPerGroup')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'rectPerGroup')
    .attr('transform', function (d, i) {
      return 'translate(' + (i * widthPer + parseInt(i / 4) * innerPadding + startx) + ',' + scaleY[i](d) + ')';
    })
    .append('rect')
    .attr('class', 'rectPer')
    .attr('x', 0)
    .attr('width', widthPer)
    .attr('height', function (d, i) {
      return height - scaleY[i](d);
    })
    .attr('fill', function (d, i) {
      return __.attrColor[i % 4];
    })
    .attr('capacity', function (d, i) {
      if (hightLight === -1) {
        return 1;
      }
      if (i % 5 === hightLight) {
        return 1;
      } else {
        return 0;
      }
    })
    .on('click', function (d, i) {
      timeId = setTimeout(function () {
        if (hightLight === -1) {
          let selected = i % 4;
          svg.selectAll('.rectPer')
            .attr('fill', function (d, i) {
              if (i % 4 !== selected) {
                return (parseInt(i / 4) % 2) ? '#666666' : '#AAAAAA';
              }
              return __.attrColor[selected];
            });
          hightLight = selected;
        } else if (i % 5 === hightLight) {
          svg.selectAll('.rectPer')
            .attr('fill', function (d, i) {
              return __.attrColor[i % 4];
            });
          hightLight = -1;
        }
      }, 300);
    })
    .on('dblclick', function (d, i) {
      dblclickColor = d3.select(this).attr('fill');
      clearTimeout(timeId);
      clearTimeout(timeId - 1);
      if (state[index] === 2) {
        state[index] = 1;
        stateCnt[2]--;
        stateCnt[1]++;
        for (let j = 0; j < 18; j++) {
          expand[index][j] = 0;
        }
      } else {
        state[index] = 2;
        stateCnt[2]++;
        stateCnt[1]--;
        let type = i % 4;
        for (let key in __.attrType) {
          if (__.attrType[key] === type) {
            let pos = attrPos[key];
            expand[index][pos] = 1;
          }
        }
      }
      renderHistogram(renderData, renderJudge);
    });

  if (state[index] === 1) {
    return;
  }
  histogram.selectAll('.lineChart').remove();
  let offsetChart = chartPadding;
  width -= widthPer * 4;
  for (let j = 0; j < 18; j++) {
    if (expand[index][j] === 1) {
      let lineChart = histogram.append('g')
        .attr('class', 'lineChart')
        .attr('transform', 'translate(' + (startx + widthPer * 2) + ',' + (heightArr[1] + offsetChart) + ')');
      lineChart.append('g')
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .style('fill', '#E5E5E5');

      let chartData = [];
      for (let k = 0; k < 9; k++) {
        chartData[k] = renderData[index].attr[k][j];
      }

      // let maxdata = d3.max(data);

      let xScale = d3.scaleLinear()
        .domain([0, chartData.length - 1])
        .range([0, width]);

      let yScale = d3.scaleLinear()
        .domain([0, d3.max(chartData) + 1])
        .range([chartHeight, 0]);

      let xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(0);

      lineChart.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + chartHeight + ')')
        .call(xAxis);

      let yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(0);

      let line = d3.line()
        .x(function (d, i) {
          return xScale(i);
        })
        .y(function (d, i) {
          return scaleY2[i * 18 + j](Math.log(d + 3));
        })
        .curve(d3.curveCardinal.tension(0.25));

      let lineGroup = lineChart.append('g');
      lineGroup.append('path')
        .attr('d', line(chartData))
        .style('fill-opacity', 0)
        .style('stroke', dblclickColor)
        .style('stroke-width', 2);

      lineGroup.selectAll('circle')
        .data(chartData)
        .enter()
        .append('circle')
        .attr('cx', function (d, i) {
          return xScale(i);
        })
        .attr('cy', function (d, i) {
          return scaleY2[i * 18 + j](Math.log(d + 3));
        })
        .attr('r', 4)
        .attr('fill', dblclickColor)
        .style('stroke', '#fff')
        .style('stroke-width', 1)
        .on('click', function (d, i) {
          displayTrees(i, __.attrName[j].slice(-3));
        });
      let yLine = lineChart.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + 0 + ',0)')
        .call(yAxis);
      lineChart.selectAll('text').remove();
      yLine.append('text')
        .text(__.attrName[j].substring(4))
        .attr('x', -14)
        .attr('text-anchor', 'end')
        .attr('dy', '1em')
        .on('click', function () {
          expand[index][j] = 0;
          renderHistogram(renderData, renderJudge);
        });
      offsetChart += chartHeight + chartPadding;
    }
  }
  dblclickColor = '#c53033';
};

const calcIndex = (offset) => {
  let sum = 0;
  for (let i = 0; i < renderData.length; i++) {
    if (state[i] !== 2) {
      sum += heightArr[state[i]];
    } else {
      for (let j = 0; j < 18; j++) {
        sum += expand[i][j] * (chartHeight + chartPadding);
      }
    }
    sum += padding;
    if (sum > offset) {
      return i;
    }
  }
  return renderData.length;
};

const renderHistogram = (data, judgeData) => {
  let dataCnt = data.length;
  renderData = data;
  const svg = d3.select('#userInfo');
  let sum = 0;
  for (let i = 0; i < dataCnt; i++) {
    if (state[i] !== 2) {
      sum += heightArr[state[i]];
    } else {
      sum += heightArr[1];
      for (let j = 0; j < 18; j++) {
        sum += expand[i][j] * (chartHeight + chartPadding);
      }
    }
    sum += padding * 2;
  }
  svg.attr('height', sum);
  svg.selectAll('.histogram').remove();
  width = (widthPer * 4 + innerPadding) * 9;
  let offset = 0;
  let tempData = [];
  for (let i = 0; i < dataCnt; i++) {
    tempData[i] = [];
    for (let j = 0; j < 36; j++) {
      tempData[i][j] = 0;
    }
    for (let j = 0; j < 9; j++) {
      if (data[i].attr[j] === undefined || data[i].attr[j].length === 0) {
        data[i].attr[j] = [];
        for (let k = 0; k < 18; k++) {
          data[i].attr[j][k] = 0;
        }
      }
      for (let k = 0; k < 18; k++) {
        let name = __.attrName[k];
        let type = __.attrType[name];
        tempData[i][j * 4 + type] += data[i].attr[j][k];
      }
    }
  }

  let scaleY = [];
  let scaleY2 = [];
  let ma = [];
  for (let i = 0; i < 36; i++) {
    ma[i] = 0;
    for (let j = 0; j < data.length; j++) {
      ma[i] = Math.max(tempData[j][i], ma[i]);
    }
  }

  for (let i = 0; i < 36; i++) {
    scaleY[i] = d3.scaleLinear().domain([ma[i] + 1, -1]).range([0, heightArr[1]]);
  }
  for (let i = 0; i < 162; i++) {
    ma[i] = 0;
    for (let j = 0; j < data.length; j++) {
      ma[i] = Math.max(data[j].attr[parseInt(i / 18)][i % 18], ma[i]);
    }
  }
  for (let i = 0; i < 162; i++) {
    scaleY2[i] = d3.scaleLinear().domain([1, Math.log(ma[i] + 3)]).range([chartHeight, 0]);
  }

  for (let i = 0; i < dataCnt; i++) {
    drawOneHistogram(tempData[i], judgeData[i].prediction, i, offset, svg, scaleY, i, scaleY2);
    if (state[i] !== 2) {
      offset += heightArr[state[i]];
    } else {
      offset += heightArr[1];
      for (let j = 0; j < 18; j++) {
        offset += expand[i][j] * (chartHeight + chartPadding);
      }
    }
    offset += padding;
  }
};

export const toTop = (idList) => {
  let cnt = 0;
  for (let i = 0; i < idList.length; i++) {
    for (let j = 0; j < renderData.length; j++) {
      if (renderData[j].usrId + '' === idList[i]) {
        let temp = renderData[j];
        renderData[j] = renderData[cnt];
        renderData[cnt] = temp;
        temp = renderJudge[j];
        renderJudge[j] = renderJudge[cnt];
        renderJudge[cnt] = temp;
        cnt++;
        break;
      }
    }
  }
  UserInfoInit(renderData, renderJudge);
};

export const UserInfoInit = (data, judgeData) => {
  let dataCnt = data.length;
  for (let i = 0; i < dataCnt; i++) {
    expand[i] = [];
    state[i] = 1;
    for (let j = 0; j < 18; j++) {
      expand[i][j] = 0;
    }
  }
  stateCnt[0] = 0;
  stateCnt[1] = dataCnt;
  stateCnt[2] = 0;
  for (let i = 0; i < __.attrName.length; i++) {
    attrPos[__.attrName[i]] = i;
  }
  renderJudge = judgeData;
  renderHistogram(data, judgeData);
};
