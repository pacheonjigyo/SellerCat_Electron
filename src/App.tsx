
import React from 'react';
import XLSX from 'xlsx';

import moment from 'moment-timezone';
import path from 'path';
import locale from 'antd/lib/locale/ko_KR';

import 'moment/locale/ko';

import { observer } from 'mobx-react';
import { AppContext } from "../AppContext";
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import { Button, Card, Col, ConfigProvider, DatePicker, Dropdown, Form, Input, Layout, Menu, Modal, Popconfirm, Row, Select, Table, Tabs, Tag, Typography, Upload, message } from 'antd';
import { CheckOutlined, DownOutlined, LoadingOutlined, FolderOpenOutlined, DeleteOutlined, StopOutlined } from '@ant-design/icons';

import "App.global.css";

var certkey: any = "";
var filesaver: any = require('file-saver');

const endpoint_kooza = "http://www.sellforyou.co.kr:3001/api/";

const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const { RangePicker } = DatePicker;
const { Header } = Layout;
const { Text } = Typography;

const stores = ["스마트스토어", "쿠팡", "G마켓/옥션", "인터파크", "11번가"]

const match: any = {
  "주문번호(해외)": "주문번호",
  "상품명(중문)": "상품명",
  "상품명(영문)": "상품명",
  "색상": "옵션",
  "사이즈": "옵션",
  "수량": "수량",
  "단가": "단가",
  "합계": "실지불금액",
  "이미지URL": "이미지",
  "상품URL": "상품링크",
  "배송사": "물류회사",
  "TRACKING#": "운송장번호",
  "결제일": "결제일",
  "제품총액": "실지불금액"
}

const RESOURCES_PATH = path.join(__dirname, '../assets/center');

var uploaded: any = [[], [], [], [], []];

let count = 0;

const Hello = observer(
  function () {
    const [ formShipping ] = Form.useForm();
    const { orderStore } = React.useContext(AppContext);
    
    setShippingFormValues();

    const menu = (
      <Menu onClick={handleButtonClick}>    
        <Menu.Item key="월별">
          월별
        </Menu.Item>
    
        <Menu.Item key="기간">
          기간
        </Menu.Item>
      </Menu>
    );

    onload = () => {
      const taobao: any = document.getElementById('window-order');
      const naver: any = document.getElementById('window-naver');
      const coupang: any = document.getElementById('window-coupang');

      taobao.addEventListener('ipc-message', (event: any) => {
        const { args, channel } = event;
    
        switch(channel) {
          case "userid": {
            orderStore.setUserId(args[0]);
            orderStore.setUserLoading(false);

            orderStore.loadOrders();

            break;
          }

          case "slider": {
            if (orderStore.gather_load) {
              orderStore.showSlideOrder(args[0]);
            }

            break;
          }

          case "slider-page": {
            orderStore.showSlideOrder(args[0]);

            break;
          }

          case "loaded": {
            orderStore.setGatherState(false);

            Modal.success({
              title: '일괄 수집',
              content: '수집이 완료되었습니다.',
            });

            notification("일괄 수집", "수집이 완료되었습니다.");

            break;
          }

          case "v1": {
            var percent: any = (args[0].data.page.currentPage / args[0].data.page.totalPage) * 100;
            var percent_formatted: any = isFinite(percent) ? percent > 100 ? "(100%)" : "(" + parseInt(percent) + "%)" : "";

            // var errors: any = 0;
            var data: any = {}

            orderStore.showSlideOrder(false);
            orderStore.setGatherText("수집 중... " + percent_formatted);

            for (var i = 0; i < args[0].data.mainOrders.length; i++) {
              var key = orderStore.orderdata.length + 1
              var duplicated = false;

              data = args[0].data.mainOrders[i];
              data['key'] = key;

              orderStore.orderdata.map((item: any) => {
                if(item['order_number'] === data['id']) {
                  duplicated = true;

                  // errors++;
                }
              });

              if (!duplicated) {
                orderStore.addOrderData(key, 'tb', data);

                key++;
              }
            }

            orderStore.sortOrderData();

            break;
          }

          case "v2": {
            count++;

            var percent: any = (count / orderStore.orderdata.length) * 100;
            var percent_formatted: any = isFinite(percent) ? percent > 100 ? "(100%)" : "(" + parseInt(percent) + "%)" : "";

            orderStore.setDetailText("수집 중... " + percent_formatted);

            if(args[0].order_id !== "") {
              orderStore.updateOrderData('tb', args[0]);
            }

            if (count === orderStore.orderdata.length) {
              orderStore.setDetailState(false);

              Modal.success({
                title: '상세 수집',
                content: '수집이 완료되었습니다.',
              });

              notification("상세 수집", "수집이 완료되었습니다.");
            }

            break;
          }

          default: break;
        }
      });

      taobao.addEventListener('dom-ready', () => {
        if (taobao.getURL().includes('https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm')) {
            // message.info('로그인 되었습니다.');

            orderStore.setUserLoading(true);
            orderStore.setLoginState(true);

            orderStore.showSlideOrder(false);

            orderStore.setGatherState(false);
            orderStore.setDetailState(false);

            orderStore.initUserData();
            orderStore.initOrderData();

            // taobao.openDevTools();

            // console.log("LOGIN");
        } else {
          if (taobao.getURL().includes('https://login.taobao.com/member/login.jhtml?redirectURL')) {
            orderStore.showSlideOrder(true);
          }
        }
      });

      naver.addEventListener('ipc-message', (event: any) => {
        const { args, channel } = event;
    
        switch(channel) {
          case "login": {
            orderStore.setLoginNaverState(args[0]);

            // message.info("로그인 되었습니다.");

            break;
          }

          case "cross": {
            var data: any = {}

            for (var i = 0; i < args[0].data.data.deliveryList.elements.length; i++) {
              data = args[0].data.data.deliveryList.elements[i];

              orderStore.addNaverData(data);
            }

            message.success("연동이 완료되었습니다.");

            break;
          }

          default: break;
        }
      });

      coupang.addEventListener('ipc-message', (event: any) => {
        const { args, channel } = event;
    
        switch(channel) {
          case "login": {
            orderStore.setLoginCoupangState(args[0]);

            // message.info("로그인 되었습니다.");

            break;
          }

          case "cross": {
            orderStore.addCoupangData(args[0].index, args[0].data);

            message.success("연동이 완료되었습니다.");

            break;
          }

          default: break;
        }
      });
    }

    function notification(title: string, description: string) {
      new Notification(title, {
        body: description,
        icon: path.join(__dirname, '../assets/icon.png')
      });
    }

    return <div>
      <Header style={{top: "0", width: "100vw", background: "white"}}>
        <Row>
          <Col span={6} style={{textAlign: "left", fontSize: 24}}>
            <Button size="large" onClick={openConfigs}>
              환경 설정
            </Button>
          </Col>

          <Col span={12} style={{textAlign: "center"}}>
            {orderStore.user_load ?
              <div>
                <LoadingOutlined /> 
                
                &nbsp;
                
                데이터 동기화 중...
              </div>
            :
              <div >
                <img src="../assets/icons/96x96.png" />
              </div>
            }
          </Col>

          <Col span={6} style={{textAlign: "right", fontSize: 24}}>
            {orderStore.login ?
              <Button size="large" onClick={switchUser}>
                로그아웃
              </Button>
            :
              null
            }

            &nbsp;

            <Button size="large" onClick={showCertModal}>
              정품 등록
            </Button>
          </Col>
        </Row>
      </Header>

      <Card>
        {orderStore.login ?
          orderStore.slider_order ?
            <div style={{"textAlign": "center"}}>
              <h2 style={{"textAlign": "center"}}>
                화면 중앙에 나타난 슬라이드 바를 마우스로 드래그하여 잠금을 해제해주세요.
              </h2>

              잠금이 해제되지 않는 경우, 우측 버튼을 클릭하여 목록 이동 후 재시도 바랍니다.

              &nbsp;
              
              <Button size="small" onClick={backToForeground}>
                수집 중단하고 목록으로 돌아가기
              </Button>

              <br />
              <br />
              <br />
            </div>
          :
            <div style={{"textAlign": "center"}}>
              <Dropdown.Button size="large" overlay={menu} icon={<DownOutlined />}>
                {orderStore.dropdown}
              </Dropdown.Button>

              &nbsp;

              {orderStore.dropdown === "전체" ? 
                <Input size="large" disabled value="전체 기간" style={{width: "250px"}} />
              :
                <ConfigProvider locale={locale}>
                  {orderStore.dropdown === "월별" ?
                    <DatePicker size="large" placeholder="날짜 선택" picker="month" style={{width: "250px"}} onChange={onDateChanged}/>
                  :
                    <RangePicker size="large" placeholder={["시작 날짜", "종료 날짜"]} style={{width: "250px"}} onChange={onRangeChanged}/>
                  }
                </ConfigProvider>
              }

              &nbsp;

              <Button type="primary" size="large" icon={orderStore.gather_icon} onClick={webviewGather}>
                {orderStore.gather_text}
              </Button>

              &nbsp;

              {nullArrayChecker(orderStore.orderdata.slice()) ? 
                <Button disabled size="large">
                  {orderStore.detail_text}
                </Button>
              :
                <Button loading={orderStore.detail_load} type="primary" size="large" icon={orderStore.detail_icon} onClick={webviewDetail}>
                  {orderStore.detail_text}
                </Button>
              }

              &nbsp;

              <Button size="large" onClick={convertExcel}>
                엑셀 파일 저장
              </Button>

              &nbsp;

              <Button size="large" onClick={uploadExcel}>
                판매 채널 엑셀 업로드
              </Button>

              {/* &nbsp;

              <Button size="large" type="dashed" onClick={() => {orderStore.showSlideOrder(true);}}>
                백그라운드
              </Button> */}
              
              <br />
              <br />
              
              {orderStore.dropdown === '월별' && orderStore.dateparams.length > 0 ?
                <>
                  {orderStore.dateparams.map((v: any) => { 
                    return <Tag key={v} color="blue" closable style={{
                    }} onClose={() => {
                      orderStore.removeClickedDate(v);
                    }}>
                      {v}
                    </Tag>
                  })}
                </>
              :
                null
              }

              <br />
              <br />

              {nullArrayChecker(orderStore.orderdata.slice()) ? <div style={{height: "70vh"}} /> : <Table size="small" columns={orderStore.orderattr} dataSource={orderStore.orderdata.slice()} pagination={{pageSize: 100}} scroll={{x: 1000, y: 600}} />}
            </div>
        : 
          orderStore.slider_order ?
            <div style={{textAlign: "center", fontSize: 16}}>
              로그인 후 이용하실 수 있습니다.
            </div>
          :
            <div style={{textAlign: "center", fontSize: 16}}>
              <LoadingOutlined />
              
              &nbsp;
              
              잠시만 기다려주세요...
            </div>
        }
      </Card>

      <webview id="window-order" preload="./preload-order.js" src="https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm" style={{width: "100vw", height: orderStore.height_order}} />
      <webview id="window-naver" preload="./preload-naver.js" src="https://sell.smartstore.naver.com/#/naverpay/sale/delivery" style={{width: "100vw", height: orderStore.height_naver}} />
      <webview id="window-coupang" preload="./preload-coupang.js" src="https://wing.coupang.com/login" style={{width: "100vw", height: orderStore.height_coupang}} />

      <Modal title={orderStore.userid + "님, 안녕하세요!"} visible={orderStore.license_modal} centered width={600} onOk={handleEditClose} onCancel={handleEditClose} footer={false}>
        {orderStore.user_limit === "" ?
          <Row style={{textAlign: "center"}}>
            <Col span={19}>
              <Input placeholder={"발급받은 인증 키를 입력해주시기 바랍니다."} size="large" style={{textAlign: "center"}} onChange={(e: any) => {certkey = e.target.value}} />
            </Col>

            <Col span={1} />

            <Col span={4}>
              <Button size="large" type="primary" onClick={addCertification}>
                등록하기
              </Button>
            </Col>
          </Row>
        :
          <Row style={{textAlign: "center"}}>
            <Col span={24}>
              정품 인증을 받았습니다. ({orderStore.user_limit} 까지 사용 가능)
            </Col>
          </Row>
        }
      </Modal>

      <Modal title="환경 설정" visible={orderStore.config_modal} centered width={450} onOk={handleConfigClose} onCancel={handleConfigClose} footer={false}>
        <Tabs>
          <Tabs.TabPane tab="배대지" key="1">
            <Form form={formShipping} onFinish={onShippingFinish}>
              <Form.Item wrapperCol={{ offset: 6 }} name='shipping' label='기본 배대지'>
                <Select
                  showSearch
                  style={{width: 200}}
                  placeholder="배대지 검색"
                  optionFilterProp="children"
                  onChange={async(e) => {
                    var shipping = await readFile(path.join(RESOURCES_PATH, `${e}.json`), 'utf8');
                    var shipping_json = JSON.parse(shipping);

                    orderStore.setShippingData(shipping_json['배송지목록']);

                    formShipping.setFieldsValue({'shippingType': ""});
                  }}
                  filterOption={(input: any, option: any) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {fs.readdirSync(RESOURCES_PATH).map((name: any) => (
                    <Select.Option value={name.split(".")[0]}>{name.split(".")[0]}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {orderStore.shipping_data?.length > 0 ? 
                  <Form.Item wrapperCol={{ offset: 6 }} name='shippingType' label='배송지 구분'>
                    <Select value={""} style={{width: 200}}>
                      {orderStore.shipping_data?.map((data: any) => (
                        <Select.Option key={data} value={data}>{data}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                :
                  null
              }
            
              <br />

              <Row>
                <Col span={24} style={{textAlign: "center"}}>
                  <Form.Item>
                    <Button size="large" type="primary" htmlType="submit" style={{width: 300}} onClick={() => {
                      message.info("설정이 저장되었습니다.");
                    }}>
                      저장
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Tabs.TabPane>

          <Tabs.TabPane tab="프로그램" key="2" style={{textAlign: "center"}}>
            <Popconfirm
              title={
                <div>
                  계정에 연동된 주문 관련 데이터가 영구 삭제됩니다.

                  <br />

                  한번 삭제된 데이터는 복구하실 수 없습니다.
                  
                  <br />
                  <br />
                  
                  계속하시겠습니까?
                </div>
              }
              onConfirm={initialization}
              okText="삭제"
              cancelText="취소"
            >
              <Button id="init-list" style={{width: 300}}>
                주문 목록 초기화
              </Button>
            </Popconfirm>
          </Tabs.TabPane>
        </Tabs>
      </Modal>

      <Modal title={`판매 채널 엑셀 업로드 (${orderStore.shipping})`}  visible={orderStore.upload_modal} centered width={650} onOk={handleUploadClose} onCancel={handleUploadClose} footer={false}>
        {/* <h3>
          자동 업로드
        </h3>

        <div style={{textAlign: "center", padding: 2}}>
          <Button size="large" style={{width: 150}}>
            스마트스토어
          </Button>

          &nbsp;

          <Input size="large" style={{width: 350}}/>

          &nbsp;

          <Button size="large" style={{width: 82}} onClick={() => {
            const webview: any = document.getElementById('window-naver');

            if(orderStore.login_naver) {
              webview.send("naver", {});
              webview.openDevTools();
            } else {
              message.info("로그인이 필요합니다.");

              orderStore.setLoginNaverState(false);

              webview.openDevTools();
            }
          }}>            
            연동
          </Button>
        </div>

        <div style={{textAlign: "center", padding: 2}}>
          <Button size="large" style={{width: 150}}>
            쿠팡
          </Button>

          &nbsp;

          <Input size="large" style={{width: 350}}/>

          &nbsp;

          <Button size="large" style={{width: 82}} onClick={() => {
            const webview: any = document.getElementById('window-coupang');

            if(orderStore.login_coupang) {
              orderStore.orderdata.map((data: any, index: number) => {
                webview.send("coupang", {index: index, data: data['delivery_message']});
              });
              
              webview.openDevTools();
            } else {
              message.info("로그인이 필요합니다.");

              orderStore.setLoginCoupangState(false);

              webview.openDevTools();
            }
          }}>
            연동
          </Button>
        </div>

        <br />

        <h3>
          수동 업로드
        </h3> */}

        {stores.map((cols: any, index: number) => (
          <div style={{textAlign: "center", padding: 2}}>
            <Button size="large" style={{width: 150}}>
              {cols}
            </Button>

            &nbsp;

            <Input size="large" value={orderStore.upload_text[index]} style={{textAlign: "center", width: 350}} />

            &nbsp;

            <Upload
              accept=".xlsx, .xls, .csv"
              showUploadList={false}
              beforeUpload={file => {
                const reader = new FileReader();

                reader.onload = () => {
                  let data = reader.result;
                  let workbook = XLSX.read(data, {type: 'binary'});
                  let rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
                    defval: "",
                    range: index === 0 ? 1 : 0
                  });

                  uploaded[index] = {name: cols, value: rows};

                  orderStore.setUploadText(index, file.name);
                }

                reader.readAsBinaryString(file);

                return false;
              }}
            >
              <Button size="large" icon={<FolderOpenOutlined />} />
            </Upload>

            &nbsp;

            <Button size="large" icon={<DeleteOutlined />} onClick={() => {
              uploaded[index] = [];

              orderStore.setUploadText(index, "업로드할 파일을 선택해주세요.");
            }}/>
          </div>
        ))}

        <br />
        <br />

        {/* <Button size="large" type="primary" onClick={orderToShipping}>
          배대지 양식 엑셀 저장
        </Button> */}

        <Row style={{textAlign: "center"}}>
          <Col span={24}>
            <Popconfirm
              icon={null}

              title={
                <div>
                  {orderStore.cross_load ? 
                    <div>
                      <LoadingOutlined /> 
                      
                      &nbsp;
                      
                      엑셀 파일 생성 중...
                    </div>
                  :
                    orderStore.match_success > 0 ?
                      <div>
                        <CheckOutlined />

                        &nbsp;

                        엑셀 파일 생성 완료 (전체: {orderStore.match_success + orderStore.match_failed} / 성공: {orderStore.match_success} / 실패: {orderStore.match_failed})
                      </div>
                    :
                      <div>
                        <StopOutlined />

                        &nbsp;

                        엑셀 파일 생성 실패 (전체: {orderStore.match_success + orderStore.match_failed} / 성공: {orderStore.match_success} / 실패: {orderStore.match_failed})
                      </div>
                  }

                  <br />

                  매칭 실패 목록:

                  <br />

                  <Tabs style={{width: 570}}>
                    {stores.map((data: any, index: number) => (
                      <Tabs.TabPane tab={data + " (" + orderStore.upload_fail[index].length + ")"} key={index} style={{overflow: "scroll", height: 120}}> 
                        {orderStore.cross_load || orderStore.upload_fail[index].length !== 0 ?
                          orderStore.upload_fail[index].map((error: any) => (
                            <div>
                              <Text code>
                                <Text type="danger">
                                  매칭 실패: 주문번호와 일치하는 상품을 찾지 못했습니다.
                                </Text>

                                &nbsp;
                                
                                (주문번호: {error})
                              </Text>
                            </div>
                          ))
                        :
                          null
                        }
                      </Tabs.TabPane>
                    ))}
                  </Tabs>
                </div>
              }
              onConfirm={() => {
                let msgAll = "";

                for (var i in stores) {
                  let msgEach = "";

                  for (var j in orderStore.upload_fail[i]) {
                    msgEach += `[${orderStore.upload_fail[i][j]}] `;
                  }

                  if (msgEach === "") {
                    continue;
                  }

                  msgAll += `${stores[i]}: ${msgEach}\n`;
                }

                if (msgAll === "") {
                  message.info("클립보드에 복사할 내용이 없습니다.");

                  return 0;
                }

                navigator.clipboard.writeText(msgAll).then(function() {
                  message.success("클립보드에 복사되었습니다.");
                }, function() {
                  message.error("클립보드에 복사할 수 없습니다.");
                });

                return 0;
              }}
              okText="클립보드 복사"
              cancelText="닫기"
            >
              <Button size="large" type="primary" onClick={orderToShipping}>
                배대지 양식 엑셀 저장
              </Button>
            </Popconfirm>
          </Col>
        </Row>
      </Modal>
    </div>

    function setShippingFormValues() {
      var output: any = localStorage.getItem('seller-cat-shipping');
      
      if (output !== null && output !== orderStore.shipping) {
        // console.log(output);

        // formData.setFieldsValue({'shipping': output});

        orderStore.setShipping(output);
      }
    }

    async function onShippingFinish(values: any) {
      orderStore.setShipping(values.shipping);

      localStorage.setItem('seller-cat-shipping', values.shipping);

      if (values.shippingType && values.shippingType !== "") {
        var shipping = path.join(RESOURCES_PATH, values.shipping + '.json');

        var result_data = await readFile(shipping, 'utf8');
        var result_json = JSON.parse(result_data);

        if (result_json['배송지'] !== values.shippingType) {
          result_json['배송지'] = values.shippingType;

          await writeFile(shipping, JSON.stringify(result_json));
        }
      }
    }

    function openConfigs() {
      orderStore.setConfigModal(true);
    }

    async function switchUser() {
      if (orderStore.login) {
        const webview: any = document.getElementById('window-order');

        try {
          await webview.loadURL("https://login.taobao.com/member/login.jhtml?redirectURL=http%3A%2F%2Fbuyertrade.taobao.com%2Ftrade%2Fitemlist%2Flist_bought_items.htm%3Fspm%3Da2141.241046-kr.1997525045.2.41ca6f11XwRlHG");

          orderStore.setLoginState(false);
          orderStore.showSlideOrder(true);
          orderStore.setUserId("");

          message.info("로그아웃 되었습니다.");
        } catch (e) {
          message.warning("다시시도 바랍니다.");
        }        
      } else {
        message.info("로그인이 필요합니다.");
      }
    }

    function showCertModal() {
      if (orderStore.userid === "") {
        message.info("로그인이 필요합니다.");
      } else {
        orderStore.setLicenseModal(true);
      }
    }

    async function addCertification() {
      var key = certkey.replace(" ", "");

      var data = {
        key: key,
        shop: "taobao",
        userid: orderStore.userid
    };

    await fetch(endpoint_kooza + "scverifykey", {
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(data)
    })
    .then(res => res.json())
      .then(output => {
        if (output.type === 1 || output.type === 2) {
          localStorage.setItem("seller-cat-certification-tb-" + orderStore.userid, key);

          message.success("인증 키가 등록되었습니다.");

          orderStore.setUserLevel(1);
          orderStore.setUserLimit(output.data.expiration);

          orderStore.setLicenseModal(false);
        } else if (output.type === 4) {
          message.error("인증 키 유효기간이 만료되었습니다.");
          message.info("인증 키 재발급 후 등록을 진행해주시기 바랍니다.");
        } else {
          message.error("인증 도중 에러가 발생하였습니다. (코드: " + output.type + ")");
        }
      });
    }

    function uploadExcel() {
      if (orderStore.user_level < 1) {
        message.warning("정품 등록 후 사용 가능합니다.");

        return 0;
      }

      var orders = 0;

      orderStore.orderdata.map((data: any) => {
        if (data.has_tracked) {
          orders++;
        }
      });

      if (orders == 0) {
        Modal.error({
          title: '업로드 오류',
          content: <div>
            주문 세부정보를 확인할 수 없습니다.

            <br />

            상세 수집 후 다시시도 해주시기 바랍니다.
          </div>
        });

        return 0;
      }

      orderStore.setUploadModal(true);

      return 0;
    }

    function initialization() {
      Object.keys(localStorage).map((data) => {
        if (!data.includes('seller-cat-certification') && data.includes(orderStore.userid)) {
          localStorage.removeItem(data);
        }
      });

      orderStore.initOrderData();

      message.info("초기화되었습니다.");
    }

    function backToForeground() {
      orderStore.showSlideOrder(false);
      
      if (orderStore.gather_load) {
        webviewGather(null);
      }

      if (orderStore.detail_load) {
        webviewDetail(null);
      }
    }

    function handleEditClose() {
      orderStore.setLicenseModal(false);
    }

    function handleConfigClose() {
      orderStore.setConfigModal(false);
    }

    function handleUploadClose() {
      orderStore.setUploadModal(false);

      for(var i = 0; i < uploaded.length; i++) {
        uploaded[i] = [];

        orderStore.setUploadText(i, "업로드할 파일을 선택해주세요.");
      }
    }

    function onDateChanged(value: any, date: any) {
      orderStore.addNewDate(date);

      console.log(value);
    }

    function onRangeChanged(value: any, date: any) {
      orderStore.dateparams = date;

      console.log(value);
    }

    function handleButtonClick(e: any) {
      if (e.key === '전체' || e.key === '월별' || e.key === '기간') {
        orderStore.dateparams = [];
        orderStore.changeDropdown(e.key);
      }
    }

    function webviewGather(e: any) {
      const webview: any = document.getElementById('window-order');

      if (orderStore.dateparams.length > 0) {
        notification("일괄 수집을 시작합니다.", "이 작업은 약간의 시간이 소요될 수 있습니다.");

        orderStore.setGatherState(true);

        webview.send("collect", {"type": orderStore.dropdown, "data": orderStore.dateparams.slice()});
      } else {
        message.warning("조회 기간 또는 날짜를 선택해주세요.");
      }

      console.log(e);
    }

    function webviewDetail(e: any) {
      const webview: any = document.getElementById('window-order');

      if (orderStore.user_level < 1) {
        message.warning("정품 등록 후 사용 가능합니다.");

        return 0;
      }

      if(orderStore.detail_load) {
        orderStore.setGatherText("중단 중...");

        webview.loadURL('https://buyertrade.taobao.com/trade/itemlist/list_bought_items.htm');
      } else {
        let filtered = orderStore.orderdata.filter((v: any) => !v.has_tracked);
        
        if (filtered.length === 0) {
          Modal.info({
            title: '상세 수집',
            content: '이미 수집완료 상태입니다.',
          });

          return 0;
        }

        orderStore.setDetailState(true);

        count = 0;

        orderStore.orderdata.map((v: any) => {
          if (v.has_tracked) {
            count += 1;
          } else {
            webview.send("extract", v.order_number);
          }
        })
      }

      console.log(e);

      return 0;
    }

    function nullArrayChecker(output: any) {
      if(output != null && typeof output === "object" && !Object.keys(output).length)
        return true;
      else
        return false;
    }

    function stringToArrayBuffer(s: any) { 
      var buf = new ArrayBuffer(s.length);
      var view = new Uint8Array(buf);

      for (var i = 0; i < s.length; i++) 
        view[i] = s.charCodeAt(i) & 0xFF;

      return buf;
    }

    function convertExcel() {
      if (orderStore.user_level < 1) {
        message.warning("정품 등록 후 사용 가능합니다.");

        return 0;
      }

      var data = orderStore.exceldata.slice();

      if(!nullArrayChecker(data))
      {
        moment.tz.setDefault("Asia/Seoul");

        var wb = XLSX.utils.book_new();
        var newWorksheet = XLSX.utils.json_to_sheet(data);
        
        XLSX.utils.book_append_sheet(wb, newWorksheet, '주문수집');

        var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
        var date = moment().format('YYMMDDHHmmSS');

        filesaver.saveAs(new Blob([stringToArrayBuffer(wbout)], {type:"application/octet-stream"}), orderStore.userid + '_tb_' + date + '.xlsx');
      }
      else
      {
        message.error('주문 목록이 비어 있습니다.');
      }

      return 0;
    }

    function orderToShipping() {
      if (!nullArrayChecker(uploaded)) {
        if (orderStore.shipping !== "") {
          var bundle = 0;

          var array: any = [];
          var finished: any = [];

          var sheetname = "Sheet1";
          var shipping = path.join(RESOURCES_PATH, orderStore.shipping + '.json');

          orderStore.setCrossLoading(true);
          orderStore.setMatchSuccess(0);
          orderStore.setMatchFailed(0);

          orderStore.exceldata.map(() => {
            finished.push(false);
          });
          
          readFile(shipping, 'utf8').then(async(json: any) => {
            if (orderStore.shipping === '빅보이') {
              for (var z = 0; z < 2; z++) {
                array.push({});
              }
            }

            if (orderStore.shipping === '쉽다' || orderStore.shipping === '퀵스타') {
              array.push({
                "그룹번호": "그룹번호",
                "묶음값": "신청번호",
                "제품번호": "제품번호",
                "배대지국가": "배대지국가",
                "받는국가": "받는국가",
                "신청인": "신청인",
                "해외총구매비": "해외총구매비",
                "운송업체코드": "운송업체코드",
                "운송업체": "운송업체",
                "운송장번호": "운송장번호",
                "통관조회번호": "통관조회번호",
                "부가서비스[입고]": "부가서비스[입고]",
                "부가서비스[출고]": "부가서비스[출고]",
                "재고번호": "재고번호",
                "상품명(중문)": "상품명",
                "HSCODE": "품목(HS)",
                "품목번호": "품목번호",
                "단가": "단가",
                "수량": "수량",
                "상품URL": "상세url",
                "TRACKING#": "현지트레킹번호",
                "주문번호(해외)": "현지주문번호",
                "이미지URL": "이미지url",
                "색상": "옵션1",
                "사이즈": "옵션2",
                "옵션3": "옵션3",
                "옵션4": "옵션4",
                "현지운송료": "현지운송료",
                "현지세금": "현지세금",
                "제품상태": "제품상태",
                "입고메모": "입고메모",
                "수취인명(한글)": "수취인*",
                "수취인명(영문)": "수취인영문*",
                "우편번호": "우편번호*",
                "기본주소": "주소*",
                "상세주소": "상세주소*",
                "영문주소": "영문주소*",
                "영문상세주소": "영문상세주소*",
                "핸드폰": "연락처*",
                "개인통관고유부호": "개인통관번호",
                "배송시요청사항": "배송메시지",
                "신청일": "신청일",
                "출고일": "출고일",
                "출고보류": "출고보류",
                "운송방법": "운송방법",
                "가로": "가로",
                "세로": "세로",
                "높이": "높이",
                "부피무게": "부피무게",
                "실무게": "실무게",
                "적용무게": "적용무게",
                "기본배송비": "기본배송비",
                "포장박스수량": "포장박스수량",
                "무게할증료": "무게할증료",
                "부피할증료": "부피할증료",
                "부가서비스비용[입고]": "부가서비스비용[입고]",
                "부가서비스비용[출고]": "부가서비스비용[출고]",
                "수수료": "수수료",
                "추가금액": "추가금액",
                "추가금액메모": "추가금액메모",
                "추가할인": "추가할인",
                "추가할인메모": "추가할인메모",
                "배송비합계": "배송비합계",
              });
            }

            if (orderStore.shipping === '퍼스트배대지') {
              for (var z = 0; z < 6; z++) {
                array.push({});
              }
            }

            for (var i = 0; i < uploaded.length; i++) {
              var userform: any;
              var data = uploaded[i].value;
              
              sheetname = JSON.parse(json)['시트명']

              orderStore.initUploadFailed(i);
  
              switch(uploaded[i].name) {
                case '스마트스토어': {
                  console.log(uploaded[i]);

                  userform = {
                    "개인통관고유부호": ["개인통관고유부호"],
                    "배송시요청사항": ["배송메세지"],
                    "상세주소": ["배송메세지"],
                    "상품번호": ["상품번호"],
                    "수취인명(한글)": ["수취인명"],
                    "우편번호": ["우편번호"],
                    "상품주문번호": ["상품주문번호"],
                    "기본주소": ["배송지"],
                    "핸드폰": ["수취인연락처1"],
                    "배송주소": ["배송지"],
                    "상품명(한글)": ["상품명"],
                    
                    "국내사이트 주문 번호": ["상품주문번호"]
                  }
  
                  break;
                }
  
                case '쿠팡': {
                  userform = {
                    "개인통관고유부호": ["개인통관번호(PCCC)"],
                    "배송시요청사항": ["배송메세지"],
                    "상세주소": ["배송메세지"],
                    "상품번호": ["노출상품ID"],
                    "수취인명(한글)": ["수취인이름"],
                    "우편번호": ["우편번호"],
                    "상품주문번호": ["주문번호"],
                    "기본주소": ["수취인 주소"],
                    "핸드폰": ["통관용구매자전화번호"],
                    "배송주소": ["수취인 주소"],
                    "상품명(한글)": ["상품명"]
                  }
  
                  break;
                }

                case 'G마켓/옥션': {
                  userform = {
                    "개인통관고유부호": ["수령인 통관정보"],
                    "배송시요청사항": ["배송시 요구사항"],
                    "상세주소": ["배송시 요구사항"],
                    "상품번호": ["상품번호"],
                    "수취인명(한글)": ["수령인명"],
                    "우편번호": ["우편번호"],
                    "상품주문번호": ["주문번호", "주문번호*"],
                    "기본주소": ["주소"],
                    "핸드폰": ["수령인 휴대폰"],
                    "배송주소": ["주소"],
                    "상품명(한글)": ["상품명"]
                  }
  
                  break;
                }

                case '인터파크': {
                  userform = {
                    "개인통관고유부호": ["개인통관정보"],
                    "배송시요청사항": ["배송메세지"],
                    "상세주소": ["배송메세지"],
                    "상품번호": ["상품번호"],
                    "수취인명(한글)": ["수령자명"],
                    "우편번호": ["우편번호"],
                    "상품주문번호": ["주문번호"],
                    "기본주소": ["주소"],
                    "핸드폰": ["수령자휴대폰번호"],
                    "배송주소": ["주소"],
                    "상품명(한글)": ["상품명"]
                  }
  
                  break;
                }

                case '11번가': {
                  userform = {
                    "개인통관고유부호": ["세관신고정보"],
                    "배송시요청사항": ["배송메세지"],
                    "상세주소": ["배송메세지"],
                    "상품번호": ["상품번호"],
                    "수취인명(한글)": ["수취인"],
                    "우편번호": ["우편번호"],
                    "상품주문번호": ["주문번호"],
                    "기본주소": ["주소"],
                    "핸드폰": ["휴대폰번호"],
                    "배송주소": ["주소"],
                    "상품명(한글)": ["상품명"]
                  }
  
                  break;
                }
  
                default: break;
              }

              for (var a in data) {
                if (uploaded[i].name === '스마트스토어') {
                  data[a]['배송지'] = `${data[a]['기본배송지']} ${data[a]['상세배송지']}`;
                }

                var dependence = false;
                var matched = false;

                var sample = JSON.parse(json);

                for (var b in data[a]) {
                  for (var c in userform) {
                    for (var d in userform[c]) {
                      if (userform[c][d] === b) {
                        if(sample.hasOwnProperty(c)) {
                          sample[c] = data[a][b];

                          if (c === '수취인명(한글)') {
                            var out = data[a][b].replace(/[a-zA-Z]/g, "");
    
                            if (out.length > 0) {
                              var name_en: string | undefined = "";
                              var res = await fetch('https://dict.naver.com/name-to-roman/translation/?query=' + data[a][b])
                              var text: string = await res.text();
                              
                              const parser = new DOMParser();
                              const htmlDocument = parser.parseFromString(text, "text/html");
                              const section = htmlDocument.documentElement.querySelector("#container > div > table > tbody > tr:nth-child(1) > td.cell_engname > a");
                      
                              name_en = section?.textContent?.replace(" ", "").toUpperCase();
                            } else {
                              name_en = data[a][b];
                            }

                            if(sample.hasOwnProperty('수취인명(영어)')) {
                              sample['수취인명(영어)'] = name_en;
                            }

                            if(sample.hasOwnProperty('구매자이름')) {
                              sample['구매자이름'] = name_en;
                            }
                          }
                        }                  
                      }
                    }
                  }
                }

                orderStore.exceldata.map((order: any, index: number) => {
                  console.log(order, sample)

                  // 패턴이 일치하는 주문번호가 있을 수 있음
                  if (order['배송메시지'].toString().includes(sample['상품주문번호']) && !finished[index] && order['단가'] > 0 && order['운송장번호'] !== "") {
                    matched = true;

                    finished[index] = true;

                    for (var b in match) {
                      if(sample.hasOwnProperty(b)) {
                        sample[b] = order[match[b]];
                      }
                    }
                  }
                });

                if (sample.hasOwnProperty('상세주소')) {
                  if (sample['상세주소'] === "") {
                    sample['상세주소'] = sample['배송시요청사항'] ? sample['배송시요청사항'] : ".";
                  }
                }

                if (sample.hasOwnProperty('오픈마켓')) {
                  if (orderStore.shipping === '타오반점') {
                    sample['오픈마켓'] = uploaded[i].name === "스마트스토어" ? "스토어팜" : uploaded[i].name;
                  } else {
                    sample['오픈마켓'] = uploaded[i].name;
                  }
                }

                if (sample.hasOwnProperty('핸드폰')) {
                  sample['핸드폰'] = sample['핸드폰'].replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
                }

                if (matched) {
                  if (array.length > 0) {
                    var previous = array[array.length - 1];

                    if (previous['수취인명(한글)'] === sample['수취인명(한글)'] && previous['기본주소'] === sample['기본주소'] && previous['상세주소'] === sample['상세주소'] && previous['핸드폰'] === sample['핸드폰']) {
                      dependence = true;
                    }
                  }

                  if (!dependence) {
                    bundle++;
                  }

                  if (sample.hasOwnProperty('묶음값')) {
                    sample['묶음값'] = bundle
                  }

                  delete sample['배송지목록'];

                  if (orderStore.shipping === '래피드에어' || orderStore.shipping === '쉽다' || orderStore.shipping === '퀵스타' || orderStore.shipping === '빅보이') {
                    delete sample['상품주문번호'];
                  }

                  if (sample['열고정'] === "") {
                    delete sample['시트명'];
                    delete sample['열고정'];

                    array.push(sample);
                  } else {
                    var temp: any = {};

                    for (var x in sample['열고정']) {
                      temp[x] = sample[sample['열고정'][x]];
                    }

                    array.push(temp);
                  }

                  orderStore.setMatchSuccess(orderStore.match_success + 1);
                } else {
                  orderStore.addUploadFailed(i, sample['상품주문번호'])

                  orderStore.setMatchFailed(orderStore.match_failed + 1);
                }
              }
            }
          }).then(() => {
            if (orderStore.match_success > 0) {
              orderStore.setCrossLoading(false);

              moment.tz.setDefault("Asia/Seoul");

              var wb = XLSX.utils.book_new();
              var newWorksheet = XLSX.utils.json_to_sheet(array);
              
              XLSX.utils.book_append_sheet(wb, newWorksheet, sheetname);
        
              var date = moment().format('YYMMDDHHmmSS');

              if (orderStore.shipping === '쉽다' || orderStore.shipping === '퀵스타') {
                var wbout = XLSX.write(wb, {bookType:'biff8',  type: 'binary'});
          
                filesaver.saveAs(new Blob([stringToArrayBuffer(wbout)], {type:"application/octet-stream"}), orderStore.shipping + '_' + date + '.xls');
              } else {
                var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
          
                filesaver.saveAs(new Blob([stringToArrayBuffer(wbout)], {type:"application/octet-stream"}), orderStore.shipping + '_' + date + '.xlsx');
              }

              // handleUploadClose();
            } else {
              orderStore.setCrossLoading(false);
            }
          });
        } else {
          message.warning("배대지를 선택해주세요.");
        }
      } else {
        message.warning("업로드할 파일을 선택해주세요.");
      }
    }
  }
);

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Hello} />
      </Switch>
    </Router>
  );
}
