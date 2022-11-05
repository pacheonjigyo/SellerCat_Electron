const { ipcRenderer: ipc } = require('electron');

let odlist = [
  [1, '//trade.taobao.com/trade/detail/trade_order_detail.htm'],
  [2, '//trade.tmall.com/detail/orderDetail.htm'],
  [3, '//tradearchive.taobao.com/trade/detail/trade_item_detail.htm'],
];

document.addEventListener('DOMNodeInserted', function(e) {
  try {
    let div = e.target.querySelectorAll('div')

    for (var i = 0; i < div.length; i++) {

      if (div[i].getAttribute('class').includes('dialog-content')) {
        ipc.sendToHost('slider', true);

        return 0;
      }

      if (div[i].getAttribute('class').includes('warnning-text')) {
        ipc.sendToHost('slider-page', true);

        return 0;
      }
    }
  } catch (err) {
    return 0;
  }

  if (e.target.tagName === 'SCRIPT') {
    try {
      if (e.target.getAttribute('src').includes('https://tbskip.taobao.com/json/show_buddy_biz_order.do')) {
        ipc.sendToHost('slider', false);
      }

      if (e.target.getAttribute('src').includes('//show.re.taobao.com/feature_v1.htm')) {
        ipc.sendToHost('slider-page', false);
      }
    } catch (e) {
      console.log(e);
    }
  }
});

function getParameterByName(name, url) {
  name = name.replace(/[\[\]]/g, '\\$&');

  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'), results = regex.exec(url);

  if (!results) 
    return null;

  if (!results[2]) 
    return '';

  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseDecode(blob) {
  return new Promise((resolve, reject) => {
    var reader = new FileReader();

    reader.onload = function (e) {
      var text = reader.result;
      
      resolve(text)
    }

    reader.readAsText(blob, 'GBK')
  })
}

async function fetchOrder(num, dateBegin, dateEnd) {
  var data = Object.assign(
    {
      dateBegin: dateBegin,
      dateEnd: dateEnd,
      options: 0,
      pageNum: num,
      pageSize: 50,
      prePageNo: num > 1 ? num - 1 : num,
      queryOrder: 'desc',
    }
  );

  var url = 'https://buyertrade.taobao.com/trade/itemlist/asyncBought.htm?action=itemlist/BoughtQueryAction&event_submit_do_query=1&_input_charset=utf8';
  var form = new URLSearchParams();

  for (var name in data) {
    form.append(name, data[name]);
  }

  var res = await fetch(url, {
    body: form,
    method: 'POST'
  });

  var blob = await res.blob();
  var data = await parseDecode(blob);
  var json = await JSON.parse(data);
  
  ipc.sendToHost('v1', {"page": num, "data": json});

  return json.page.prefetchCount;
}

document.addEventListener('DOMContentLoaded', async function() {
  if (document.URL.includes('https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm')) {
    var find = false;

    while (true) {
      try {
        let id = document.querySelectorAll('#J_SiteNavLogin a');
        
        for (var i = 0; i < id.length; i++) {
          if (id[i].getAttribute('href').includes('//i.taobao.com/my_taobao.htm')) {
            ipc.sendToHost('userid', id[i].textContent);

            find = true;

            break;
          }
        }
      } catch (e) {
        console.log(e);
      }

      if (find) {
        break;
      } else {
        await sleep(1000 * 1);
      }
    }

    ipc.on('collect', async(event, props) => {
      var dateBegin = 0;
      var dateEnd = 0;

      switch(props['type']) {
        case '월별': {
          for (var i in props['data']) {
            var monthly = props['data'][i].split('-');

            var year = parseInt(monthly[0]);
            var month = parseInt(monthly[1]);
  
            //GMT+08:00 00:00 TO 23:59
            dateBegin = (new Date(year, month - 1, 1, 1, 0, 0)).getTime();
            dateEnd = (new Date(year, month, 0, 24, 59, 59)).getTime();

            var count = 1;

            while (true) {
              var preCount = await fetchOrder(count, dateBegin, dateEnd);

              if (preCount <= 0) {
                break;
              }

              count++;
            }
          }

          break;
        }

        case '기간': {
          var dailybegin = props['data'][0].split('-');
          var dailyend = props['data'][1].split('-');

          var yearbegin = parseInt(dailybegin[0]);
          var yearend = parseInt(dailyend[0]);
          
          var monthbegin = parseInt(dailybegin[1]);
          var monthend = parseInt(dailyend[1]);
          
          var daybegin = parseInt(dailybegin[2]);
          var dayend = parseInt(dailyend[2]);
          
          //GMT+08:00 00:00 TO 23:59
          dateBegin = (new Date(yearbegin, monthbegin - 1, daybegin, 1, 0, 0)).getTime();
          dateEnd = (new Date(yearend, monthend - 1, dayend, 24, 59, 59)).getTime();

          var count = 1;

          while (true) {
            var preCount = await fetchOrder(count, dateBegin, dateEnd);

            if (preCount <= 0) {
              break;
            }

            count++;
          }

          break;
        }

        default: break;
      }

      await ipc.sendToHost("loaded", {});
    });

    ipc.on('extract', async(event, props) => {
      var json = {
        "order_id": props,
        "order_phone": "",

        "pay_date": "",
        "pay_ali": "",
        
        "delivery_address": "",
        "delivery_company": "",
        "delivery_code": "",
        "delivery_message": "",
        "delivery_etc": "",
      };

      if (props !== "") {
        var message_resp = await fetch(`https://buyertrade.taobao.com/trade/json/getMessage.htm?biz_order_id=${props}&user_type=1&archive=false`);
    
        var message_blob = await message_resp.blob();
        var message_data = await parseDecode(message_blob);
        var message_json = await JSON.parse(message_data);
    
        if (message_json.tip) {
          json['delivery_message'] = message_json.tip.slice(3, message_json.tip.length);
        }
      
        var detail_resp = await fetch(`https://buyertrade.taobao.com/trade/json/transit_step.do?bizOrderId=${props}`);
    
        var detail_blob = await detail_resp.blob();
        var detail_data = await parseDecode(detail_blob);
        var detail_json = await JSON.parse(detail_data);
    
        if (detail_json.isSuccess === "true") {
          json['delivery_company'] = detail_json.expressName;
          json['delivery_code'] = detail_json.expressId ?? "";
    
          json['pay_date'] = detail_json.address[detail_json.address.length - 1].time;
        }
      }

      await ipc.sendToHost("v2", json);
    });
  } 

  // for (var a = 0; a < odlist.length; a++) {
  //   if (document.URL.includes(odlist[a][1])) {
  //     var type = odlist[a][0];
  //     var items;

  //     var json = {
  //       "order_id": "",
  //       "order_phone": "",

  //       "pay_date": "",
  //       "pay_ali": "",
        
  //       "delivery_address": "",
  //       "delivery_company": "",
  //       "delivery_code": "",
  //       "delivery_message": "",
  //       "delivery_etc": "",
  //     };

  //     switch(type) {
  //       case 1: { // TAOBAO
  //         items = document.querySelectorAll('#detail-panel div');

  //         for (var i = 0; i < items.length; i++) {
  //           try {
  //             var deliveryType = 0;

  //             if (items[i].getAttribute('class') === ('partial-ship-mod__box-body___py2jk')) { 
  //               deliveryType = 1;
  //             }

  //             switch (deliveryType) {
  //               case 1: {
  //                 let text = items[i].querySelectorAll('span');
  
  //                 for (var c = 0; c < text.length; c++) {
  //                   if (text[c].getAttribute('data-reactid')?.includes("partial-ship-item0.1.0.2.1")) {
  //                     json['delivery_company'] = text[c].textContent.trim().replaceAll("—", "");
  
  //                     console.log('물류 회사: ' + text[c].textContent);
  //                   }
  
  //                   if (text[c].getAttribute('data-reactid')?.includes("partial-ship-item0.1.0.3.1")) {
  //                     json['delivery_code'] = text[c].textContent.trim().replaceAll("—", "");
  
  //                     console.log('운송장번호: ' + text[c].textContent);
  //                   }
  //                 }

  //                 break;
  //               }

  //               default: {
  //                 if (items[i].getAttribute('class') === ('logistics-info-mod__container___39ogG')) {
  //                   let text = items[i].querySelectorAll('td');
    
  //                   for (var c = 0; c < text.length; c++) {
  //                     if (text[c].getAttribute('data-reactid')?.includes("0.4.3.0.2.1")) {
  //                       json['delivery_company'] = text[c].textContent.trim().replaceAll("—", "");
    
  //                       console.log('물류 회사: ' + text[c].textContent);
  //                     }
    
  //                     if (text[c].getAttribute('data-reactid')?.includes("0.4.3.0.3.1")) {
  //                       json['delivery_code'] = text[c].textContent.trim().replaceAll("—", "");
    
  //                       console.log('운송장번호: ' + text[c].textContent);
  //                     }
  //                   }
  //                 }

  //                 break;
  //               }
  //             }
              
  //             if (items[i].getAttribute('class') === ('app-mod__tabs-container___iwi0I')) {
  //               let text = items[i].querySelectorAll('span');

  //               for (var c = 0; c < text.length; c++) {
  //                 if (text[c].getAttribute('data-reactid')?.includes("0.0.2.0.0.1.0.1.0.1")) {
  //                   json['order_phone'] = text[c].textContent.trim().replaceAll("—", "");

  //                   console.log('연락처: ' + text[c].textContent);
  //                 }

  //                 if (text[c].getAttribute('data-reactid')?.includes("0.0.5.1.$1.$0.1.$0")) {
  //                   json['order_id'] = text[c].textContent.trim().replaceAll("—", "");

  //                   console.log('주문번호: ' + text[c].textContent);
  //                 }

  //                 if (text[c].getAttribute('data-reactid')?.includes("0.0.5.1.$1.$1.1.0")) {
  //                   json['pay_ali'] = text[c].textContent.trim().replaceAll("—", "");

  //                   console.log('알리페이 번호: ' + text[c].textContent);
  //                 }

  //                 if (text[c].getAttribute('data-reactid')?.includes("0.0.5.1.$1.$3.1.0")) {
  //                   json['pay_date'] = text[c].textContent.trim().replaceAll("—", "");

  //                   console.log('결제일자: ' + text[c].textContent);
  //                 }
  //               }
  //             }

  //             if (items[i].getAttribute('class') === ('address-memo-mod__address-note___q3Fub')) {
  //               var dl = items[i].querySelectorAll('dl');

  //               for (var d = 0; d < dl.length; d++) {
  //                 try {
  //                   if (dl[d].querySelector('dt').textContent.includes("收货地址")) {
  //                     json['delivery_address'] = dl[d].querySelector('dd').textContent.trim().replaceAll("—", "");

  //                     console.log('배송 주소: ' + dl[d].querySelector('dd').textContent)
  //                   }

  //                   if (dl[d].querySelector('dt').textContent.includes("新收货地址")) {
  //                     json['delivery_address'] = dl[d].querySelector('dd').textContent.trim().replaceAll("—", "");

  //                     console.log('새 배송 주소: ' + dl[d].querySelector('dd').textContent)
  //                   }
                    
  //                   if (dl[d].querySelector('dt').textContent.includes("买家留言")) {
  //                     json['delivery_message'] = dl[d].querySelector('dd').textContent.trim().replaceAll("—", "");

  //                     console.log('배송 메시지: ' + dl[d].querySelector('dd').textContent)
  //                   }
  //                 } catch (e) {
  //                   continue;
  //                 }
  //               }
  //             }
  //           } catch (e) {
  //             continue;
  //           }
  //         }

  //         ipc.sendToHost('extract', json);

  //         break;
  //       }

  //       case 2: { // TMALL
  //         while (true) {
  //           var items = document.querySelectorAll('#J_trade_status div');

  //           if (items.length === 0) {
  //             await sleep(1000 * 1);
  //           } else {
  //             for (var i = 0; i < items.length; i++) {
  //               try {
  //                 if (items[i].getAttribute('class').includes('infoBlock')) {
  //                   var text = items[i].querySelectorAll('span');
                    
  //                   var invoiceType = 0;

  //                   var anchor = [];

  //                   for (var j = 0; j < text.length; j++) {
  //                     if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$0.1.$0')) {
  //                       json['delivery_address'] = text[j].textContent.trim().replaceAll("—", "");
  //                       console.log('배송 주소: ' + text[j].textContent);
  //                     }

  //                     if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$1.1.$0')) {
  //                       if (text[j].textContent === '修改地址/发票') {
  //                         invoiceType = 1;
  //                       }
  //                     }

  //                     if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$2.1.$0')) {
  //                       if (text[j].textContent === '个人') {
  //                         invoiceType = 2;
  //                       }
  //                     }

  //                     switch (invoiceType) {
  //                       case 1: {
  //                         if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$2.1.$0')) {
  //                           json['delivery_message'] = text[j].textContent.trim().replaceAll("—", "");
  //                           console.log('배송 메시지: ' + text[j].textContent);
  //                         }
  
  //                         if (text[j].textContent === '订单编号') {
  //                           var anchor = text[j].getAttribute('data-reactid').split("$");
  //                         }
  
  //                         if (anchor.length > 0) {
  //                           var seq = parseInt(anchor[1][0]);
  
  //                           if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$' + seq.toString() + '.1.$0')) {
  //                             json['order_id'] = text[j].textContent.trim().replaceAll("—", "");
  //                             console.log('주문번호: ' + text[j].textContent);
  //                           }
  
  //                           if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$' + seq.toString() + '.1.$1.0.1.0.1.0.$0.1:$0.0')) {
  //                             json['pay_ali'] = text[j].textContent.trim().replaceAll("—", "");
  //                             console.log('알리페이 번호: ' + text[j].textContent);
  //                           }
  
  //                           if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$' + seq.toString() + '.1.$1.0.1.0.1.0.$2.1:$0.0')) {
  //                             json['pay_date'] = text[j].textContent.trim().replaceAll("—", "");
  //                             console.log('결제일자: ' + text[j].textContent);
  //                           }
                            
  //                           if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$' + (seq + 1).toString() + '.1.$1.0.1.0.1.0.$2.1:$0.0')) {
  //                             json['order_phone'] = text[j].textContent.trim().replaceAll("—", "");
  //                             console.log('연락처: ' + text[j].textContent);
  //                           }
  //                         }

  //                         break;
  //                       }

  //                       case 2: {
  //                         if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$1.1.$0')) {
  //                           json['delivery_message'] = text[j].textContent.trim().replaceAll("—", "");
  //                           console.log('배송 메시지: ' + text[j].textContent);
  //                         }
  
  //                         if (text[j].textContent === '订单编号') {
  //                           var anchor = text[j].getAttribute('data-reactid').split("$");
  //                         }
  
  //                         if (anchor.length > 0) {
  //                           var seq = parseInt(anchor[1][0]);
  
  //                           if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$' + seq.toString() + '.1.$0')) {
  //                             json['order_id'] = text[j].textContent.trim().replaceAll("—", "");
  //                             console.log('주문번호: ' + text[j].textContent);
  //                           }
  
  //                           if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$' + seq.toString() + '.1.$1.0.1.0.1.0.$0.1:$0.0')) {
  //                             json['pay_ali'] = text[j].textContent.trim().replaceAll("—", "");
  //                             console.log('알리페이 번호: ' + text[j].textContent);
  //                           }
  
  //                           if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$' + seq.toString() + '.1.$1.0.1.0.1.0.$2.1:$0.0')) {
  //                             json['pay_date'] = text[j].textContent.trim().replaceAll("—", "");
  //                             console.log('결제일자: ' + text[j].textContent);
  //                           }
                            
  //                           if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$' + (seq + 1).toString() + '.1.$1.0.1.0.1.0.$2.1:$0.0')) {
  //                             json['order_phone'] = text[j].textContent.trim().replaceAll("—", "");
  //                             console.log('연락처: ' + text[j].textContent);
  //                           }
  //                         }

  //                         break;
  //                       }

  //                       default: {
  //                         if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$1.1.$0')) {
  //                           json['delivery_message'] = text[j].textContent.trim().replaceAll("—", "");
  //                           console.log('배송 메시지: ' + text[j].textContent);
  //                         }
  
  //                         if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$2.1.$0')) {
  //                           json['order_id'] = text[j].textContent.trim().replaceAll("—", "");
  //                           console.log('주문번호: ' + text[j].textContent);
  //                         }
  
  //                         if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$2.1.$1.0.1.0.1.0.$0.1:$0.0')) {
  //                           json['pay_ali'] = text[j].textContent.trim().replaceAll("—", "");
  //                           console.log('알리페이 번호: ' + text[j].textContent);
  //                         }
  
  //                         if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$2.1.$1.0.1.0.1.0.$2.1:$0.0')) {
  //                           json['pay_date'] = text[j].textContent.trim().replaceAll("—", "");
  //                           console.log('결제일자: ' + text[j].textContent);
  //                         }
                          
  //                         if (text[j].getAttribute('data-reactid').includes('2.0.0.0.0.0.0.1.$3.1.$1.0.1.0.1.0.$2.1:$0.0')) {
  //                           json['order_phone'] = text[j].textContent.trim().replaceAll("—", "");
  //                           console.log('연락처: ' + text[j].textContent);
  //                         }

  //                         break;
  //                       }
  //                     }
  //                   }
  //                 }

  //                 if (items[i].getAttribute('class').includes('trade-detail-logistic')) {
  //                   var text = items[i].querySelectorAll('span');
  
  //                   try {
  //                     json['delivery_company'] = text[0].textContent.trim().replaceAll("—", "");
  //                     console.log('물류 회사: ' + text[0].textContent);

  //                     json['delivery_code'] = text[2].textContent.trim().replaceAll("—", "");
  //                     console.log('운송장번호: ' + text[2].textContent);
  //                   } catch (e) { 
  //                     continue;
  //                   }
  //                 }
  //               } catch (e) {
  //                 console.log(e);

  //                 continue;
  //               }
  //             }

  //             break;
  //           }
  //         }
               
  //         ipc.sendToHost('extract', json);

  //         break;
  //       }

  //       case 3: { // TAOBAO ARCHIVE
  //         items = document.querySelector('#J_TabView > div > div > div');

  //         let text = items.querySelectorAll('span');

  //         for (var c = 0; c < text.length; c++) {
  //           try {
  //             if (text[c].getAttribute('class') === 'order-num') {
  //               json['order_id'] = text[c].textContent.trim().replaceAll("—", "");
  //               console.log('주문번호: ' + text[c].textContent);
  //             }

  //             if (text[c].getAttribute('class') === 'alilay-num') {
  //               json['pay_ali'] = text[c].textContent.trim().replaceAll("—", "");
  //               console.log('알리페이 번호: ' + text[c].textContent);
  //             }

  //             if (text[c].getAttribute('class') === 'pay-time') {
  //               json['pay_date'] = text[c].textContent.trim().replaceAll("—", "");
  //               console.log('결제일자: ' + text[c].textContent);
  //             }
  //           } catch (e) {
  //             console.log(e);

  //             continue;
  //           }
  //         }

  //         let details = items.querySelectorAll('table.simple-list.logistics-list tr');

  //         for (var c = 0; c < details.length; c++) {
  //           let info = details[c].querySelectorAll('td');

  //           for (var d = 0; d < info.length; d++) {
  //             try {
  //               if (info[d].getAttribute('class') === 'label') {
  //                 if (info[d].textContent.includes('收货地址')) {
  //                   json['delivery_address'] = info[d + 1].textContent.trim().replaceAll("\t", "").replaceAll("—", "");
  //                   console.log('배송 주소: ' + info[d + 1].textContent);
  //                 }

  //                 if (info[d].textContent.includes('物流公司')) {
  //                   json['delivery_company'] = info[d + 1].textContent.trim().replaceAll("—", "");
  //                   console.log('물류 회사: ' + info[d + 1].textContent);
  //                 }

  //                 if (info[d].textContent.includes('运单号')) {
  //                   json['delivery_code'] = info[d + 1].textContent.trim().replaceAll("—", "");
  //                   console.log('운송장번호: ' + info[d + 1].textContent);
  //                 }

  //                 if (info[d].textContent.includes('买家留言')) {
  //                   json['delivery_message'] = info[d + 1].textContent.trim().replaceAll("—", "");
  //                   console.log('배송 메시지: ' + info[d + 1].textContent);
  //                 }
  //               }
  //             } catch (e) {
  //               console.log(e);

  //               continue;
  //             }
  //           }
  //         }

  //         ipc.sendToHost('extract', json);

  //         break;
  //       }

  //       default: break;
  //     }
  //   }
  // }
});

