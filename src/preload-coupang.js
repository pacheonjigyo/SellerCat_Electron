const { ipcRenderer: ipc } = require('electron');

async function fetchCoupang(props) {
  try {
    var res = await fetch('https://wing.coupang.com/tenants/sfl-portal/order/detail/' + props['data'] + '/order');

    if (res.status === 200) {
      var json = await res.json();

      console.log(json);

      ipc.sendToHost('cross', {index: props['index'], data: json});
    }
  } catch (e) {
    return 0;
  }

  return 0;
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log(document.URL);
  
  if (document.URL.includes('https://wing.coupang.com/configuration/account/change-password/guide')) {
    ipc.sendToHost('login', true);

    ipc.on('coupang', async(event, props) => {
      await fetchCoupang(props);
    })
  } 
});

