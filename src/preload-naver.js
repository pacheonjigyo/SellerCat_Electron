const { ipcRenderer: ipc } = require('electron');

async function fetchNaver(num) {
  var url = 'https://sell.smartstore.naver.com/o/v3/graphql';

  console.log("test1");

  var res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operationName: "smartstoreFindDeliveriesBySummaryInfoType_ForSaleDelivery",

      query: 
      `
        query smartstoreFindDeliveriesBySummaryInfoType_ForSaleDelivery($merchantNo: String!, $paging_page: Int, $paging_size: Int, $serviceType: ServiceType!, $sort_direction: SortDirectionType, $sort_type: SortType, $summaryInfoType: SummaryInfoType) {
          deliveryList: smartstoreFindDeliveriesBySummaryInfoType_ForSaleDelivery(merchantNo: $merchantNo, paging_page: $paging_page, paging_size: $paging_size, serviceType: $serviceType, sort_direction: $sort_direction, sort_type: $sort_type, summaryInfoType: $summaryInfoType) {
            elements {
              ...deliveryElementField
              __typename
            }
            
            pagination {
              ...paginationField
              __typename
            }
            
            __typename
          }
        }
      
        fragment deliveryElementField on DeliveryMp {
          deliveryFeeClass
          deliveryInvoiceNo
          orderQuantity
          productName
          payDateTime
          deliveryDateTime
          deliveryFeeRatingClass
          productOrderMemo
          orderMemberId
          remoteAreaCostChargeAmt
          salesCommissionPrepay
          payLocationType
          totalDiscountAmt
          orderNo
          payMeansClass
          productClass
          commissionClassType
          purchaserSocialSecurityNo
          oneYearOrderAmt
          saleChannelType
          oneYearOrderCount
          receiverAddress
          deliveryCompanyName
          sellerProductManagementCode
          grade
          sellingInterlockCommissionClassType
          sellingInterlockCommissionInflowPath
          orderMemberTelNo
          deliveryFeeAmt
          claimNo
          deliveryMethod
          deliveryMethodPay
          biztalkAccountId
          giftName
          receiverTelNo2
          productPayAmt
          receiverTelNo1
          sixMonthOrderAmt
          orderStatus
          productUnitPrice
          waybillPrintDateTime
          threeMonthOrderCount
          orderMemberName
          productOrderNo
          deliveryCompanyCode
          productOptionContents
          dispatchDueDateTime
          knowledgeShoppingCommissionAmt
          productOptionAmt
          productNo
          individualCustomUniqueCode
          orderDateTime
          placingOrderDateTime
          inflowPath
          receiverName
          settlementExpectAmt
          deliveryNo
          threeMonthOrderAmt
          sellerDiscountAmt
          deliveryFeeDiscountAmt
          dispatchDateTime
          sixMonthOrderCount
          receiverZipCode
          payCommissionAmt
          takingGoodsPlaceAddress
          syncDateTime
          productOrderStatus
          sellerInternalCode2
          sellerOptionManagementCode
          sellerInternalCode1
          deliveryBundleGroupSeq
          productUrl
          __typename
        }
          
        fragment paginationField on Pagination {
          size
          totalElements
          page
          totalPages
          __typename
        }
      `,

      variables: {
        merchantNo: "",
        paging_page: 1,
        paging_size: 100,
        serviceType: "MP",
        sort_direction: "DESC",
        sort_type: "RECENTLY_ORDER_YMDT",
        summaryInfoType: "DELIVERY_READY"
      },
    }),
    method: 'POST'
  });

  console.log("test2");

  var json = await res.json();

  console.log(json);

  ipc.sendToHost('cross', {"page": num, "data": json});

  return json.data.deliveryList.pagination.totalPages;
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log(document.URL);

  if (document.URL.includes('https://adcenter.shopping.naver.com/member/login')) {
    ipc.sendToHost('login', true);
  }
  
  if (document.URL === 'https://sell.smartstore.naver.com/#/naverpay/sale/delivery') {
    ipc.sendToHost('login', true);
    
    ipc.on('naver', async(event, props) => {
      var total = await fetchNaver(1);

      for (var i = 2; i <= total; i++) {
        await fetchNaver(i);
      }
    })
  } 
});

