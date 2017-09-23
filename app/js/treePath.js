import * as d3 from 'd3';
const renderTree = (data, attr) => {
  d3.select('#pathInfo').selectAll('*').remove();
  d3.select('#pathInfo').attr('height', data.length * 530);
  let svg, width, height, duration, root, treemap, i;
  for (let j = 0; j < data.length; j++) {
    svg = d3.select('#pathInfo').append('g')
              .attr('height', 530)
              .attr('width', 440)
              .attr('transform', 'translate(' + 410 + ',' + (30 + 530 * j) + ') rotate(' + 90 + ')');
    width = 530;
    height = 400;
    i = 0;
    duration = 750;
    treemap = d3.tree().size([height, width]);

    // Assigns parent, children, height, depth
    root = d3.hierarchy(data[j], function (d) { return d.children; });
    root.x0 = height / 2;
    root.y0 = 0;

    // Collapse after the second level
    root.children.forEach(collapse);

    update(root);
  }

  function collapse (d) {
    let contains = 0;
    if (d.children) {
      d._children = d.children;
      for (let i = 0; i < d._children.length; i++) {
        contains += collapse(d._children[i]);
      }
    } else {
      d.children = null;
    }
    if (d.data.id === attr || d.data.name.indexOf(attr) !== -1) contains += 1;

    if (contains === 0) {
      d.children = null;
    } else {
      d._children = null;
    }
    return contains;
  }

  function update (source) {
    let treeData = treemap(root);

    let nodes = treeData.descendants();
    let links = treeData.descendants().slice(1);

    let maxDep = 0;

    nodes.forEach(function (d) { maxDep = Math.max(maxDep, d.depth); });

    let widthPer = width / (maxDep + 1);

    nodes.forEach(function (d) { d.y = d.depth * widthPer; });

    let node = svg.selectAll('g.node')
        .data(nodes, function (d) { return d.id || (d.id = ++i); });

    let nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', function (d) {
          return 'translate(' + source.y0 + ',' + source.x0 + ')';
        });

    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style('fill', function (d) {
          if (d.data.id === attr || d.data.name.indexOf(attr) !== -1) {
            return 'red';
          }
          return d._children ? 'lightsteelblue' : '#fff';
        })
        .on('click', function (d) {
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          update(d);
        });

    nodeEnter.append('text')
        .attr('dy', '.35em')
        .attr('x', function (d) {
          return d.children || d._children ? -13 : 13;
        })
        .attr('text-anchor', function (d) {
          return (d.data.name.slice(-1) === '0') ? 'start' : 'end';
        })
        .style('opacity', 0)
        .text(function (d) { return d.data.name; })
        .on('mouseover', function () {
          d3.select(this).style('opacity', 1);
        })
        .on('mouseout', function () {
          d3.select(this).style('opacity', 0);
        })
        .attr('transform', 'rotate(' + 270 + ')');

    let nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition()
      .duration(duration)
      .attr('transform', function (d) {
        return 'translate(' + d.y + ',' + d.x + ')';
      });

    nodeUpdate.select('circle.node')
      .attr('r', 10)
      .style('fill', function (d) {
        if (d.data.id === attr || d.data.name.indexOf(attr) !== -1) {
          return 'red';
        }
        return d._children ? 'lightsteelblue' : '#fff';
      })
      .attr('cursor', 'pointer');

    let nodeExit = node.exit().transition()
        .duration(duration)
        .attr('transform', function (d) {
          return 'translate(' + source.y + ',' + source.x + ')';
        })
        .remove();

    nodeExit.select('circle')
      .attr('r', 1e-6);

    nodeExit.select('text')
      .style('fill-opacity', 1e-6);

    let link = svg.selectAll('path.link')
        .data(links, function (d) { return d.id; });

    let linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', function (d) {
          let o = {x: source.x0, y: source.y0};
          return diagonal(o, o);
        });

    let linkUpdate = linkEnter.merge(link);

    linkUpdate.transition()
        .duration(duration)
        .attr('d', function (d) {
          return diagonal(d, d.parent);
        })
        .attr('stroke', '#ccc')
        .attr('stroke-width', 4);

    link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
          let o = {x: source.x, y: source.y};
          return diagonal(o, o);
        })
        .remove();

    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    function diagonal (s, d) {
      let path = `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`;

      return path;
    };
  };
};

export const renderPath = (data) => {
  /* for (let i = 0; i < data.length; i++) {
    let key = data[i].data.name + data[i].data.size;
    if (key in pathCnt) {
      pathCnt[key] += 1;
    } else {
      pathCnt[key] = 1;
    }
  }
  renderTree(treeData); */
};

export const pathInfoInit = (data, attr) => {
  renderTree(data, attr);
};
