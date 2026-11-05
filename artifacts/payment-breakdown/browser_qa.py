import sys,json,re
from pathlib import Path
sys.path.insert(0,str(Path('.qa-tools').resolve()))
from playwright.sync_api import sync_playwright, expect
state={'role':'admin','writes':[]}
oid='123456789012345678901234'
lines=[{'serviceId':str(i),'serviceName':name,'discountAmount':100,'discountPercent':10,'optionBreakdown':[]} for i,name in enumerate(['Social Media Profile Management','Visual Content - Reels with editing and subtitles for multiple campaigns','Ads'])]
order={'_id':oid,'orderNumber':'GV-PAYMENT-QA','client':{'_id':'client','name':'Test Client'},'paymentStatus':'pending','paymentMethod':'online','orderStatus':'in_progress','amount':10030,'subtotal':8500,'originalSubtotal':9000,'discountTotal':300,'gstAmount':1530,'gstRate':18,'adCreditTotal':200,'adCreditApplied':{'metaAds':200},'subtotalBeforeAdCredit':8700,'couponSnapshot':{'code':'SAVE','serviceBreakdown':lines},'createdAt':'2026-11-03T10:00:00Z','items':[{'_id':oid,'serviceSnapshot':{'name':'Ads','slug':'ads','category':'Advertising'},'quantity':1,'amount':9000,'formData':{'metaAdsAdSpendAmount':5000}}]}
def handler(route):
    u=route.request.url
    if '/auth/me' in u:data={'user':{'_id':'qa','name':'QA','role':state['role']}}
    elif route.request.method=='PATCH':
        state['writes'].append(route.request.post_data_json);order['paymentStatus']='processing';data={'order':order}
    elif '/ad-credit' in u:data={'budgets':{'metaAds':5000,'googleAds':0},'available':{'metaAds':0,'googleAds':0},'issued':{},'entries':[]}
    elif '/employees' in u:data={'employees':[]}
    elif '/orders/' in u:data={'order':order}
    else:data={}
    route.fulfill(status=200,content_type='application/json',body=json.dumps({'success':True,**data}))
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.route('**/*',lambda route: handler(route) if '/api/' in route.request.url else route.continue_() if route.request.url.startswith('http://127.0.0.1:5175/') else route.abort())
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    checks=[]
    for role,prefix in [('admin','admin'),('employee','staff')]:
        state['role']=role;order['paymentStatus']='pending'
        page.goto(f'http://127.0.0.1:5175/{prefix}/orders/{oid}');page.wait_for_load_state('networkidle')
        card=page.locator('section').filter(has=page.get_by_role('heading',name='Payment Status',exact=True)).first
        toggle=card.get_by_role('button',name=re.compile('payment breakdown'))
        expect(toggle).to_have_attribute('aria-expanded','false')
        expect(card.get_by_role('combobox',name='Payment status')).to_be_visible()
        assert card.get_by_text('Original subtotal',exact=True).evaluate('(e)=>e.closest("[aria-hidden]").getAttribute("aria-hidden")')=='true'
        card.screenshot(path=f'artifacts/payment-breakdown/{role}-collapsed.png')
        toggle.focus();page.keyboard.press('Enter')
        expect(toggle).to_have_attribute('aria-expanded','true')
        for label in ['Original subtotal','Coupon (SAVE)','Ads amount (included in subtotal)','Ad credit applied','Taxable subtotal','GST (18%)']:
            expect(card.get_by_text(label,exact=True)).to_be_visible()
        for width in [1440,768,390,360]:
            page.set_viewport_size({'width':width,'height':1000})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert card.locator('dl').evaluate('(e)=>e.scrollWidth <= e.clientWidth')
        card.screenshot(path=f'artifacts/payment-breakdown/{role}-expanded-mobile.png')
        page.keyboard.press('Space');expect(toggle).to_have_attribute('aria-expanded','false')
        select=card.get_by_role('combobox',name='Payment status');select.click()
        page.get_by_role('option',name='Processing',exact=True).click()
        expect(select).to_have_text('Processing',use_inner_text=True)
        checks.append(role+' collapsed/keyboard toggle/details/status update/responsive')
    assert len(state['writes'])==2
    assert not errors,errors
    Path('artifacts/payment-breakdown/results.json').write_text(json.dumps({'passed':checks,'widths':[1440,768,390,360],'pageErrors':errors,'api':'mocked'},indent=2))
    print('PASS: admin and employee collapse, keyboard, details, status updates, four responsive widths, no page errors')
    browser.close()
