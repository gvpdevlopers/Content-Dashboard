import sys,json
from pathlib import Path
sys.path.insert(0,str(Path('.qa-tools').resolve()))
from playwright.sync_api import sync_playwright, expect
oid='123456789012345678901234'
sid='123456789012345678901235'
pid='123456789012345678901236'
state={'role':'admin','writes':[]}
service={'_id':sid,'name':'Ads','slug':'ads','category':'Advertising','serviceGroup':'content','isActive':True,'pricingType':'custom','basePrice':0,'minQuantity':1,'fields':[],'repeatableGroups':[], 'pricingOptions':[{'_id':pid,'name':'Meta Ads','group':'metaAds','price':1200,'unit':'30 days','minQuantity':1,'isActive':True,'fields':[{'name':'metaAdsAdSpendAmount','label':'Ad spend','type':'number','required':True,'min':0,'includeValueInPrice':True}]}]}
form={'metaAds':pid,'metaAdsAdSpendAmount':5000,'pricingQuantities':{'metaAds':1}}
order={'_id':oid,'orderNumber':'GV-CREDIT-QA','client':{'_id':'client','name':'Test Client'},'paymentStatus':'paid','paymentMethod':'online','orderStatus':'in_progress','amount':7316,'subtotal':6200,'gstRate':18,'gstAmount':1116,'createdAt':'2026-11-03T10:00:00Z','items':[{'_id':sid,'serviceSnapshot':service,'quantity':1,'amount':6200,'formData':form}]}
wallet={'available':{'metaAds':2000,'googleAds':0},'budgets':{'metaAds':5000,'googleAds':0},'issued':{},'settled':True,'entries':[]}
draft={'_id':oid,'title':'Ads wallet draft','services':[{'serviceId':sid,'quantity':1,'formData':form}], 'createdAt':'2026-11-03T10:00:00Z','updatedAt':'2026-11-03T10:00:00Z'}
def handler(route):
    u=route.request.url
    if '/auth/me' in u:data={'user':{'_id':'qa','name':'QA','role':state['role'],'serviceAccess':{'mode':'groups','groups':['content']}}}
    elif '/ad-credit' in u:
        if route.request.method=='POST':
            body=route.request.post_data_json;state['writes'].append({'url':u,'body':body})
            if u.endswith('/apply'):
                assert body['confirmed'] is True
                amount=float(body['adCredit']['metaAds']);wallet['available']['metaAds']-=amount
                order.update(adCreditTotal=amount,adCreditApplied={'metaAds':amount},subtotalBeforeAdCredit=6200,subtotal=6200-amount,amount=round((6200-amount)*1.18,2))
            else:
                amount=float(body['amount']);wallet['available']['metaAds']+=amount;wallet['issued']['metaAds']=amount
                wallet['entries']=[{'id':'entry','kind':'issued','platform':'metaAds','amount':amount,'note':body['note'],'actor':{'name':'QA'},'order':{'_id':oid,'orderNumber':'GV-CREDIT-QA'},'createdAt':'2026-11-05T10:00:00Z'}]
        data=wallet
    elif '/services' in u:data={'services':[service]}
    elif '/drafts' in u:data={'drafts':[draft]} if u.endswith('/drafts') else {'draft':draft,'accessIssues':[]}
    elif '/payment-pricing' in u:data={'gstRates':{'cod':0,'online':18,'chequeWithGst':18,'chequeDirectCollection':0,'month_end':18}}
    elif '/orders/quote' in u:
        body=route.request.post_data_json; state['writes'].append({'url':u,'body':body});amount=float(body.get('adCredit',{}).get('metaAds',0))
        data={'quote':{'amount':6200-amount,'subtotal':6200-amount,'adCreditTotal':amount,'gstRate':0,'gstAmount':0}}
    elif '/latest' in u:data={'order':None}
    elif '/packages' in u:data={'packages':[]}
    elif u.endswith('/orders') or u.endswith('/orders/admin') or u.endswith('/orders/staff'):data={'orders':[order]}
    elif '/orders/' in u:data={'order':order}
    elif '/employees' in u:data={'employees':[]}
    else:data={}
    route.fulfill(status=200,content_type='application/json',body=json.dumps({'success':True,**data}))
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.route('**/*',lambda route: handler(route) if '/api/' in route.request.url else route.continue_() if route.request.url.startswith('http://127.0.0.1:5175/') else route.abort())
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
    for role,prefix in [('admin','admin'),('employee','staff')]:
        state['role']=role;wallet['issued']={};wallet['settled']=True;order['paymentStatus']='paid';order['adCreditTotal']=0
        page.goto(f'http://127.0.0.1:5175/{prefix}/orders/{oid}');page.wait_for_load_state('networkidle')
        page.get_by_label('Remaining ad spend',exact=False).fill('250')
        page.get_by_label('Reason / campaign reference').fill('Confirmed unspent during campaign')
        page.get_by_role('button',name='Add unused spend as credit').click()
        expect(page.get_by_text('Unused spend already recorded:',exact=False)).to_be_visible()
        assert f'/{prefix}/' in state['writes'][-1]['url']
        order['paymentStatus']='pending';wallet['settled']=False
        page.reload();page.wait_for_load_state('networkidle')
        page.get_by_label('Meta Ads credit to apply',exact=False).fill('300')
        page.get_by_role('button',name='Apply ad credit',exact=True).click()
        dialog=page.get_by_role('alertdialog');expect(dialog).to_contain_text('GV-CREDIT-QA')
        before=len(state['writes']);dialog.get_by_role('button',name='Cancel').click();assert len(state['writes'])==before
        page.get_by_role('button',name='Apply ad credit',exact=True).click()
        dialog.get_by_role('button',name='Apply credit',exact=True).click()
        expect(dialog).not_to_be_visible();expect(page.get_by_text('Ad credit applied:',exact=False).first).to_be_visible()
        page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    state['role']='client'
    page.goto('http://127.0.0.1:5175/dashboard');page.wait_for_load_state('networkidle')
    expect(page.get_by_role('heading',name='Your ad credit')).to_be_visible()
    page.get_by_text('Credit history',exact=True).click();expect(page.get_by_text('Confirmed unspent during campaign',exact=True)).to_be_visible()
    expect(page.get_by_role('link',name='GV-CREDIT-QA').first).to_have_attribute('href',f'/dashboard/orders/{oid}')
    page.screenshot(path='artifacts/ad-credit/client-wallet.png',full_page=True)
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto('http://127.0.0.1:5175/dashboard/new-order');page.wait_for_load_state('networkidle')
    Path('artifacts/ad-credit/checkout-dom.txt').write_text(page.locator('body').inner_text(),encoding='utf-8')
    page.get_by_role('button',name='Resume',exact=True).click()
    page.get_by_role('checkbox',name='Use available credit',exact=False).check()
    page.get_by_role('spinbutton',name='Meta Ads credit amount').fill('150')
    expect(page.get_by_text('Ad credit applied:',exact=False).first).to_contain_text('150')
    expect(page.get_by_text('Remaining wallet balance:',exact=False)).to_contain_text('1,750')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.screenshot(path='artifacts/ad-credit/checkout-partial.png',full_page=True)
    assert not errors,errors
    Path('artifacts/ad-credit/browser-results.json').write_text(json.dumps({'passed':['admin In Progress issuance','employee In Progress issuance','admin application confirmation/cancel','employee application confirmation/cancel','updated order breakdown','client dashboard balances/history/source link','partial checkout amount/remainder','390px no overflow','no page errors'],'api':'mocked'},indent=2))
    print('PASS: 9 wallet browser checks; mocked APIs')
    browser.close()
