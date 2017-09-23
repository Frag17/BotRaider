import $ from 'jquery';
import InspireTree from 'inspire-tree';
import { toTop } from './UserInfoLayout.js';
import '../css/inspire-tree.css';

const menu = `[{
"text": "Questing",
"children": [{
"text": "040 accept quest"
}, {
"text": "045 finish quest"
}, {
"text": "100 enter instance"
}]
}, {
"text": "Attribute-related",
"children": [{
"text": "202 acquired attribute"
}, {
"text": "450 contribution to master"
}, {
"text": "200 change of exp"
}, {
"text": "201 pet exp"
}, {
"text": "582 vitality log"
}, {
"text": "470 add/del title"
}]
}, {
"text": "Combating",
"children": [{
"text": "015 monster kill"
}, {
"text": "000 cast"
}, {
"text": "025 kill boss"
}]
}, {
"text": "Item-related",
"children": [{
"text": "115 get money"
}, {
"text": "230 buy in shop"
}, {
"text": "005 item use"
}, {
"text": "105 get item"
}, {
"text": "110 get equipment"
}, {
"text": "220 drop/del record"
}]
}]
`;
const tempData = JSON.parse(menu);

export const initTree = () => {
  const tree = new InspireTree({
    target: '#select',
    data: tempData,
    dom: {
      showCheckboxes: true
    }
  });

  tree.on('model.loaded', () => {
    // tree.expand();
    tree.selectFirstAvailableNode();
    tree.nodes().expand();
    let checkBoxList = document.getElementsByTagName('input');
    for (let i = 0; i < checkBoxList.length; i++) {
      checkBoxList[i].checked = true;
    }
  });

  $('#search').on('keyup', function (event) {
    var key = event.keyCode || event.which;

    if (key === 13) {
      toTop(event.target.value.split(','));
    }
    return false;
  });
};
