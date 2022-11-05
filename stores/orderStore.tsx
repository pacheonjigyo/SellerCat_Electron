import React from 'react';

import { makeAutoObservable } from "mobx";
import { Col, Image, Typography, Row, message, Tooltip } from 'antd';
import { CheckCircleTwoTone, ExclamationCircleTwoTone, CloseCircleTwoTone, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

const endpoint_kooza = "http://www.sellforyou.co.kr:3001/api/";

export class orderStore {
    menu_key = "1";

    user_level = 0;
    user_limit = "";
    user_load = false;

    match_success = 0;
    match_failed = 0;

    cross_load = false;

    config_modal = false;
    upload_modal = false;

    dropdown: string = '월별';

    userid: string = "";

    upload_text = ["업로드할 파일을 선택해주세요.", "업로드할 파일을 선택해주세요.", "업로드할 파일을 선택해주세요.", "업로드할 파일을 선택해주세요.", "업로드할 파일을 선택해주세요."];
    upload_fail: any = [[], [], [], [], []];
    
    login = false;
    login_naver = false;
    login_coupang = false;

    slider_order = true;
    slider_product = true;

    height_order: string & {} = '100vh';
    height_product: string & {} = '100vh';

    height_naver: string & {} = '0vh';
    height_coupang: string & {} = '0vh';

    product_text: String = "페이지 열기";

    progress_value: Number = 0;
    progress_state: String = "active";

    shipping: string = "";
    shipping_data: any = [];
    
    gather_text: String = "일괄 수집";
    gather_load = false;
    gather_icon: any = null;

    license_modal = false;

    detail_text: String = "상세 수집";
    detail_load = false;
    detail_icon: any = null;

    dateparams: any = [];

    orderattr: any = [
        {
            title: '순번',
    
            dataIndex: 'key',
            key: 'key',
    
            align: 'center',
            fixed: 'left',
            width: 50,
        },
        {
            title: '상품정보',
    
            dataIndex: 'product_info',
            key: 'product_info',
    
            align: 'left',
            fixed: 'left',
            width: 650,
        },
        {
            title: '상태',
    
            dataIndex: 'status',
            key: 'status',
    
            align: 'center',
            fixed: 'left',
            width: 50,
        },
        // {
        //     title: '주문연동',
    
        //     dataIndex: 'order_cross',
        //     key: 'order_cross',
    
        //     align: 'center',
        //     fixed: 'left',
        //     width: 100,
        // },
        {
            title: '주문일',
    
            dataIndex: 'order_date',
            key: 'order_date',
    
            align: 'center',
            width: 150,
        },
        {
            title: '결제일',
    
            dataIndex: 'pay_date',
            key: 'pay_date',
    
            align: 'center',
            width: 150,
        },
        {
            title: '주문번호',
    
            dataIndex: 'order_number',
            key: 'order_number',
    
            align: 'center',
            width: 150,
        },
        {
            title: '주문상태',
    
            dataIndex: 'order_status',
            key: 'order_status',
    
            align: 'center',
            width: 100,
        },
        // {
        //     title: '배송주소',
    
        //     dataIndex: 'delivery_address',
        //     key: 'delivery_address',
    
        //     align: 'center',
        //     width: 600,
        // },
        {
            title: '물류회사',
    
            dataIndex: 'delivery_company',
            key: 'delivery_company',
    
            align: 'center',
            width: 100,
        },
        {
            title: '운송장번호',
    
            dataIndex: 'delivery_code',
            key: 'delivery_code',
    
            align: 'center',
            width: 150,
        },
        // {
        //     title: '수취인전화',
    
        //     dataIndex: 'order_phone',
        //     key: 'order_phone',
    
        //     align: 'center',
        //     width: 150,
        // },
        {
            title: '배송메시지',
    
            dataIndex: 'delivery_message',
            key: 'delivery_message',
    
            align: 'center',
            width: 150,
        },
        {
            title: '실지불금액',
    
            dataIndex: 'order_price',
            key: 'order_price',
    
            align: 'center',
            width: 100,
        },
        {
            title: <div>판매처<br />판매자</div>,
    
            dataIndex: 'store_name',
            key: 'store_name',
    
            align: 'center',
            width: 200,
        },
        // {
        //     title: '알리페이 거래번호',
    
        //     dataIndex: 'pay_ali',
        //     key: 'pay_ali',
    
        //     align: 'center',
        //     width: 250,
        // },
    ];

    exceldata: any = [];
    orderdata: any = [];

    constructor() {
        makeAutoObservable(this);
    }

    addNewDate(value: string) {
        var result = this.dateparams.some((v: any) => v === value);
  
        if (!result) {
          this.dateparams.push(value);
        }
    }

    removeClickedDate(value: string) {
        this.dateparams = this.dateparams.filter((v: any) => v !== value);
    }

    setMatchSuccess(value: number) {
        this.match_success = value;
    }

    setMatchFailed(value: number) {
        this.match_failed = value;
    }

    initUploadFailed(index: number) {
        this.upload_fail[index] = [];
    }

    addUploadFailed(index: number, value: any) {
        this.upload_fail[index].push(value);
    }

    setCrossLoading(value: boolean) {
        this.cross_load = value;
    }
    
    setUserLoading(value: boolean) {
        this.user_load = value;
    }

    setUserLevel(value: number) {
        this.user_level = value;
    }

    setUserLimit = (value: string) => {
        this.user_limit = value;
    }

    loadOrders() {
        var keys = Object.keys(localStorage).sort();
        
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];

            switch (key) {
                case "loglevel:webpack-dev-server": {
                    break;
                } 

                case "seller-cat-shipping": {
                    break;
                }

                case "seller-cat-shipping-type": {
                    break;
                }

                default: {
                    if (key.includes('seller-cat-certification')) {
                        if (key === 'seller-cat-certification-tb-' + this.userid) {
                            var serial: any = localStorage.getItem(key);

                            var data = {
                                key: serial,
                                shop: "taobao",
                                userid: this.userid
                            };
                      
                            fetch(endpoint_kooza + "scverifykey", {
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              method: "POST",
                              body: JSON.stringify(data)
                            })
                            .then(res => res.json())
                            .then(output => {
                                switch(output.type) {
                                    case 2: {
                                        this.setUserLevel(1);
                                        this.setUserLimit(output.data.expiration);

                                        break;
                                    }

                                    case 4: {
                                        message.error("인증 키가 만료되었습니다.");

                                        break;
                                    }

                                    case 5: {
                                        message.error("인증 키가 유효하지 않습니다.");

                                        break;
                                    }

                                    default: {
                                        message.error("인증 도중 에러가 발생하였습니다. (코드: " + output.type + ")");

                                        break;
                                    }
                                }
                            });
                        }
                    } else {
                        var output: any = localStorage.getItem(key);

                        var json = JSON.parse(output);

                        if (json !== null) {
                            if (json['userid'] === this.userid) {
                                this.addOrderData(json['key'], 'tb', json['order']);
                                
                                if(json['detail'] !== "") {
                                    this.updateOrderData('tb', json['detail']);
                                }
                            }
                        }
                    }

                    break;
                }
            }
        }

        this.sortOrderData();
    }

    setShipping = (value: string) => {
        this.shipping = value;
    }

    setShippingData = async(value: any) => {
        this.shipping_data = value;
    }

    setUploadText = (index: number, value: string) => {
        this.upload_text[index] = value;
    }

    setMenuKey = (value: string) => {
        this.menu_key = value;
    }

    setUserId = (value: string) => {
        this.userid = value;
    }

    setProductState = () => {
        if (this.slider_product) {
            this.product_text = "페이지 열기";

            this.showSlideProduct(false);
        } else {
            this.product_text = "페이지 닫기";

            this.showSlideProduct(true);
        }
    }

    setProgressValue = (value: Number) => {
        this.progress_value = value;
    }

    setProgressState = (value: String) => {
        this.progress_state = value;
    }

    setLicenseModal = (value: boolean) => {
        this.license_modal = value;
    }

    setConfigModal = (value: boolean) => {
        this.config_modal = value;
    }

    setUploadModal = (value: boolean) => {
        this.upload_modal = value;
    }

    setGatherState = (value: boolean) => {
        this.gather_load = value;

        if (this.gather_load) {
            this.gather_text = "로드 중...";
            this.gather_icon = <LoadingOutlined />;
        } else {
            this.gather_text = "일괄 수집";
            this.gather_icon = null;
        }
    }

    setGatherText = (value: String) => {
        this.gather_text = value;
    }

    setDetailState = (value: boolean) => {
        this.detail_load = value;

        if (this.detail_load) {
            this.detail_text = "로드 중...";
            this.detail_icon = <LoadingOutlined />;
        } else {
            this.detail_text = "상세 수집";
            this.detail_icon = null;
        }
    }

    setDetailText = (value: String) => {
        this.detail_text = value;
    }

    changeDropdown = (value: string) => {
        this.dropdown = value;
    }

    setLoginState = (value: boolean) => {
        this.login = value;
    }

    setLoginNaverState = (value: boolean) => {
        this.login_naver = value;

        if(this.login_naver) {
            this.height_naver = '0vh';
        } else {
            this.height_naver = '100vh';
        }
    }

    setLoginCoupangState = (value: boolean) => {
        this.login_coupang = value;

        if(this.login_coupang) {
            this.height_coupang = '0vh';
        } else {
            this.height_coupang = '100vh';
        }
    }

    showSlideOrder = (value: boolean) => {
        this.slider_order = value;

        if (this.slider_order) {
            this.height_order = '70vh';
        } else {
            this.height_order = '0vh';
        }
    }

    showSlideProduct = (value: boolean) => {
        this.slider_product = value;

        if (this.slider_product) {
            this.height_product = '70vh';
        } else {
            this.height_product = '0vh';
        }
    }

    initUserData = () => {
        this.setUserLevel(0);
        this.setUserLimit("");
    }

    initOrderData = () => {
        this.exceldata = [];
        this.orderdata = [];
    }

    sortOrderData = () => {
        this.orderdata.sort(function (a: any, b: any) {
            if (a.order_date > b.order_date) {
                return -1;
            }

            if (a.order_date < b.order_date) {
                return 1;
            }
            
            return 0;
        });

        this.exceldata.sort(function (a: any, b: any) {
            if (a['주문일'] > b['주문일']) {
                return -1;
            }

            if (a['주문일'] < b['주문일']) {
                return 1;
            }

            return 0;
        });

        for (var i = 0; i < this.orderdata.length; i++) {
            this.orderdata[i].key = i + 1;
        }
    }

    addOrderData = (key: any, shop: any, json: any) => {
        json['subOrders'].map((item: any, index: number) => {
            if (item['id']) {
                var option = "";

                if(item['itemInfo']['skuText']) {
                    item['itemInfo']['skuText'].map((sku: any) => {
                        option += sku.name + ": " + sku.value + " "
                    });
                }

                this.exceldata.push({
                    "상품명": item['itemInfo']['title'],
                    "단가": item['priceInfo']['realTotal'],
                    "수량": item['quantity'],
                    "옵션": item['itemInfo']['skuId'] > 0 ? option : "ONE-SIZE",
                    "상품링크": item['itemInfo']['itemUrl'].includes("http") ? item['itemInfo']['itemUrl'] : 'http:' + item['itemInfo']['itemUrl'],
                    "주문일": json['orderInfo']['createTime'],
                    "주문번호": json['id'],
                    "판매처": json['seller']['shopName'],
                    "주문상태": json['statusInfo']['text'],

                    "배송주소": "",
                    "물류회사": "",
                    "운송장번호": "",
                    "수취인전화": "",
                    "배송메시지": index,
                    "배송기타": "",

                    "실지불금액": json['payInfo']['actualFee'],
                    "이미지": item['itemInfo']['pic'].includes("http") ? item['itemInfo']['pic'].replace(/_[0-9]{2}x[0-9]{2}.[A-Za-z]{3}/g, "") : 'http:' + item['itemInfo']['pic'].replace(/_[0-9]{2}x[0-9]{2}.[A-Za-z]{3}/g, ""),
                    "옵션ID": item['itemInfo']['skuId'],
                    "판매자": json['seller']['nick'],

                    "결제일": "",
                    "알리페이 거래번호": "",
                    "셀러캣ID": this.userid,
                });
            }
        });

        this.orderdata.push({
            "key": json['key'],

            "product_info": <div>{json['subOrders'].map((item: any) => 
                (<div>{item['itemInfo']['skuId'] === 0 ? 
                    null 
                :
                    <Row>
                        <Col span={3}>
                            <Image src={item['itemInfo']['pic'].includes("http") ? item['itemInfo']['pic'].replace(/_[0-9]{2}x[0-9]{2}.[A-Za-z]{3}/g, "") : 'http:' + item['itemInfo']['pic'].replace(/_[0-9]{2}x[0-9]{2}.[A-Za-z]{3}/g, "")} width={50} height={50} alt=""/>
                        </Col>

                        <Col span={1} />

                        <Col span={20}>
                            <a href={item['itemInfo']['itemUrl'].includes("http") ? item['itemInfo']['itemUrl'] : "http:" + item['itemInfo']['itemUrl']} target="_blank" rel="noopener noreferrer">{item['itemInfo']['title']} <Text keyboard>X {item['quantity']}</Text></a>
                            
                            <br />

                            <Text type="secondary">
                                {item['itemInfo']['skuId'] > 0 ?
                                    <div>
                                        옵션명:

                                        &nbsp;

                                        {item['itemInfo']['skuText'] && item['itemInfo']['skuText'].map((sku: any) => (
                                            <Text type="secondary"> {sku.name}: {sku.value}, </Text>
                                        ))}
                                    </div>
                                :
                                    <div>
                                        옵션 없음
                                    </div>
                                }

                                옵션ID:

                                &nbsp;

                                {item['itemInfo']['skuId']}, 단가:
                                
                                &nbsp;

                                {item['priceInfo']['original'] ? 
                                    <span><Text type="secondary" delete>{item['priceInfo']['original']}</Text> → {item['priceInfo']['realTotal']}</span>
                                :
                                    <span>{item['priceInfo']['realTotal']}</span>
                                }
                            </Text>
                        </Col>
                    </Row>
                }</div>)
            )}</div>,

            "order_date": json['orderInfo']['createTime'],
            "order_number": json['id'],
            "order_price": json['payInfo']['actualFee'],
            "order_status": <a href={json['statusInfo']['url'].includes("http") ? json['statusInfo']['url'] : "http:" + json['statusInfo']['url']} target="_blank" rel="noopener noreferrer">{json['statusInfo']['text']}</a>,
            "order_url": json['statusInfo']['url'],

            "pay_date": "",
  
            "store_name": <div>{json['seller']['shopName']}<br />{json['seller']['nick']}</div>,

            "status": <Tooltip title="주문 상세 미수집">
                <ExclamationCircleTwoTone twoToneColor="#EFCE4A" />
            </Tooltip>,

            "has_completed": false,
            "has_tracked": false,
        });

        var name = this.userid + "-" + shop + "-" + json['id'];

        var data: any = {
            'key': key,
            'shop': shop,
            'order': json,
            'detail': "",
            'status': "1차",
            'userid': this.userid
        };

        localStorage.setItem(name, JSON.stringify(data));
    }

    updateOrderData = (shop: any, json: any) => {
        this.exceldata.map((data: any, index: number) => {
            if(data['주문번호'] === json['order_id']) {
                var distributed = json["delivery_message"].split(" ")
                var seq = this.exceldata[index]['배송메시지'];

                var delivery_message;

                if (distributed[seq] === undefined) {
                    delivery_message = distributed[0]
                } else {
                    delivery_message = distributed[seq]
                }

                this.exceldata[index] = {
                    ...this.exceldata[index],
                    
                    // "배송주소": json["delivery_address"],
                    "물류회사": json["delivery_company"],
                    "운송장번호": json["delivery_code"],
                    // "수취인전화": json["order_phone"],
                    "배송메시지": delivery_message,
                    // "배송기타": json["delivery_etc"],
                    "결제일": json["pay_date"],
                    // "알리페이 거래번호": json["pay_ali"]
                }
            }
        });

        this.orderdata.map((data: any, index: number) => {
            if(data['order_number'] === json['order_id']) {
                this.orderdata[index] = {
                    ...this.orderdata[index],

                    // "order_date": this.orderdata[index]['order_date'],
                    "order_phone": json['order_phone'],

                    "pay_date": json['pay_date'],
                    "pay_ali": json['pay_ali'],
                    
                    "delivery_address": json['delivery_address'],
                    "delivery_company": json['delivery_company'],
                    "delivery_code": json['delivery_code'],
                    "delivery_message": json['delivery_message'],

                    "status": json['delivery_code'] === "" ? 
                        <Tooltip title="운송장번호 누락">
                            <CloseCircleTwoTone twoToneColor="#D75A4A" />
                        </Tooltip> 
                    : 
                        <Tooltip title="주문 수집 완료">
                            <CheckCircleTwoTone twoToneColor="#25AE88" />
                        </Tooltip>
                    ,

                    "order_cross": "",

                    "has_completed": false,
                    "has_tracked": json['delivery_code'] === "" ? false : true
                }
            }
        });

        var name = this.userid + "-" + shop + "-" + json['order_id'];

        var result: any = localStorage.getItem(name);
        var orders;
        
        try {
            orders = JSON.parse(result);

            orders['detail'] = json;
            orders['status'] = '2차';
    
            localStorage.setItem(name, JSON.stringify(orders));
        } catch (e) {
            console.log(e);
        }
    }

    addNaverData = (json: any) => {        
        this.orderdata.map((data: any, index: number) => {
            if(data['delivery_message'] === json['productOrderNo']) {
                this.orderdata[index] = {
                    ...this.orderdata[index],
                    
                    "order_cross": <a href={json['productUrl']} target="_blank" rel="noopener noreferrer"><img src="../assets/naver.png" alt="" width={20} height={20} /></a>
                }
            }
        });
    }

    addCoupangData = async(key: number, json: any) => {
        this.orderdata[key] = {
            ...this.orderdata[key],
            
            "order_cross": <a href={"https://www.coupang.com/"} target="_blank" rel="noopener noreferrer"><img src="../assets/coupang.png" alt="" width={20} height={20} /></a>
        };

        console.log(json);
    }
}