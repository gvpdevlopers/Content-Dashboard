import sys, json
from pathlib import Path
sys.path.insert(0, str(Path('.qa-tools').resolve()))
from playwright.sync_api import sync_playwright
sid='123456789012345678901234'
target=json.dumps(['field','service','extras','voice'],separators=(',',':'))
service={'_id':sid,'name':'Reels','serviceGroup':'content','isActive':True,'couponTargets':[{'key':target,'label':'Add-ons: Voice-over'},{'key':'other','label':'Add-ons: Subtitles'}]}
coupons=[]; writes=[]
def handle(route):
    url=route.request.url
    if '/auth/me' in url: data={'user':{'_id':'qa','name':'QA Admin','role':'admin'}}
    elif '/coupons/admin/targets' in url: data={'services':[service]}
    elif '/coupons/admin' in url:
        if route.request.method in ['POST','PATCH']:
            body=route.request.post_data_json; writes.append(body); saved={**body,'_id':'coupon','serviceDiscounts':[{**e,'serviceName':'Reels'} for e in body.get('serviceDiscounts',[])]}; coupons[:]=[saved]; data={'coupon':saved,'message':'Coupon saved'}
        else: data={'coupons':coupons}
    else: data={}
    route.fulfill(status=200,content_type='application/json',body=json.dumps({'success':True,**data}))
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':1280,'height':900})
    page.route('**/api/**',handle)
    errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:5175/admin/coupons'); page.wait_for_load_state('networkidle')
    def choose(label, option):
        page.get_by_role('combobox',name=label,exact=True).click()
        page.get_by_role('option',name=option,exact=True).click()
    page.get_by_label('Coupon code',exact=True).fill('VOICE20')
    choose('Discount scope','Specific service options / add-ons')
    page.get_by_label('Reels discount value',exact=True).fill('20')
    page.get_by_role('combobox',name='Eligible options / add-ons').click()
    page.get_by_role('option',name='Add-ons: Voice-over',exact=True).click()
    page.keyboard.press('Escape')
    assert page.get_by_text('Add-ons: Voice-over',exact=True).count() >= 1
    page.screenshot(path='artifacts/coupon-options/admin-options.png',full_page=True)
    page.get_by_role('button',name='Create coupon',exact=True).click()
    page.get_by_role('button',name='Edit VOICE20',exact=True).wait_for()
    assert writes[-1]['scope']=='options' and writes[-1]['serviceDiscounts'][0]['targets']==[target]
    page.get_by_role('button',name='Edit VOICE20',exact=True).click()
    assert page.get_by_role('combobox',name='Discount scope').inner_text().strip()=='Specific service options / add-ons'
    assert page.get_by_label('Reels discount value',exact=True).input_value()=='20'
    choose('Reels discount type','Fixed amount (INR)')
    page.get_by_label('Reels discount value',exact=True).fill('50')
    page.get_by_role('button',name='Save changes',exact=True).click()
    page.get_by_role('button',name='Edit VOICE20',exact=True).wait_for()
    assert writes[-1]['serviceDiscounts'][0]['discountType']=='fixed'
    assert writes[-1]['serviceDiscounts'][0]['targets']==[target]
    page.get_by_role('button',name='Deactivate VOICE20',exact=True).click()
    page.get_by_role('button',name='Activate VOICE20',exact=True).wait_for()
    assert writes[-1]['scope']=='options' and writes[-1]['serviceDiscounts'][0]['targets']==[target]
    choose('Discount scope','All services')
    choose('Discount type','Fixed amount (INR)')
    page.get_by_label('Discount value',exact=True).fill('75')
    page.get_by_label('Coupon code',exact=True).fill('ALL75')
    assert page.get_by_label('Reels discount value',exact=True).count()==0
    page.get_by_role('button',name='Create coupon',exact=True).click()
    page.get_by_role('button',name='Edit ALL75',exact=True).wait_for()
    assert writes[-1]['scope']=='all' and writes[-1]['serviceDiscounts']==[]
    page.set_viewport_size({'width':390,'height':844})
    choose('Discount scope','Specific service options / add-ons')
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path='artifacts/coupon-options/admin-mobile.png',full_page=True)
    assert not errors, errors
    Path('artifacts/coupon-options/browser-results.json').write_text(json.dumps({'passed':['option selection and payload','editing preserves targets','fixed option discount','toggle preserves targeting','global fixed coupon','390px no overflow','no browser errors'],'writes':len(writes)},indent=2))
    print('PASS: 7 browser checks; mocked APIs only')
    browser.close()
