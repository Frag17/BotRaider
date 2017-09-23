/**
 * Created by vag on 2016/12/27.
 */
import $ from 'jquery';
import 'normalize.css';
import './js/jquery.responsiveTabs.js';
import './css/responsive-tabs.css';
import './css/responsive-tabs-style.css';
import 'perfect-scrollbar/dist/js/perfect-scrollbar.jquery.js';
import 'perfect-scrollbar/dist/css/perfect-scrollbar.css';
import './css/reset.css';
import './css/index.css';
import './vendor/Lato-Regular.ttf';
import { iceInit } from './js/iceLayout.js';
import { initTree } from './js/tree.js';
import __ from './js/config.js';

$(document).ready(function () {
  $.get(`${__.URL}/alltrees`, data => {
    iceInit(data);
  });
  initTree(URL);
  $('#select').perfectScrollbar();
  $('#details1').perfectScrollbar();
  $('#individual').perfectScrollbar();
  $('#individual').perfectScrollbar();
  $('#tab-1').perfectScrollbar();
  $('#tabs').responsiveTabs({
    startCollapsed: 'accordion'
  });
  $('#btn-search').on('click', function (e) {
    e.preventDefault();
    $('#search').animate({width: 'toggle'}).focus();
  });
});
