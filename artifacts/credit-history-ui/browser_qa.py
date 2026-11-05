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

state['role']='client'
wallet['hasMore']=True
wallet['entries']=[{'id':'entry','kind':'issued','platform':'metaAds','amount':250,'note':'Confirmed unused campaign funds','actor':{'name':'QA'},'order':{'_id':oid,'orderNumber':'GV-CREDIT-QA'},'createdAt':'2026-11-05T10:00:00Z'}]
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.route('**/*',lambda route: handler(route) if '/api/' in route.request.url else route.continue_() if route.request.url.startswith('http://127.0.0.1:5175/') else route.abort())
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    for width in [1440,768,390,360]:
        page.set_viewport_size({'width':width,'height':1000})
        page.goto('http://127.0.0.1:5175/dashboard');page.wait_for_load_state('networkidle')
        wallet_card=page.get_by_role('region',name='Ad credit wallet')
        toggle=wallet_card.get_by_role('button',name='Credit history',exact=True)
        expect(toggle).to_have_attribute('aria-expanded','false')
        expect(wallet_card.get_by_text('Confirmed unused campaign funds')).not_to_be_visible()
        toggle.focus();page.keyboard.press('Enter')
        expect(toggle).to_have_attribute('aria-expanded','true')
        expect(wallet_card.get_by_text('Confirmed unused campaign funds')).to_be_visible()
        expect(wallet_card.get_by_role('link',name='GV-CREDIT-QA')).to_have_attribute('href',f'/dashboard/orders/{oid}')
        wallet_card.evaluate("async el => { await Promise.all(el.getAnimations({subtree:true}).map(animation => animation.finished.catch(() => {}))); }")
        wallet_card.screenshot(path=f'artifacts/credit-history-ui/expanded-{width}.png')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        wallet_card.get_by_role('button',name='Next',exact=True).click()
        expect(wallet_card.get_by_text('Page 2',exact=True)).to_be_visible()
        expect(toggle).to_have_attribute('aria-expanded','true')
        wallet_card.get_by_role('button',name='Previous',exact=True).click()
        expect(wallet_card.get_by_text('Page 1',exact=True)).to_be_visible()
        toggle.focus();page.keyboard.press('Space')
        expect(toggle).to_have_attribute('aria-expanded','false')
        expect(wallet_card.get_by_role('link',name='GV-CREDIT-QA')).not_to_be_visible()
        wallet_card.evaluate("async el => { await Promise.all(el.getAnimations({subtree:true}).map(animation => animation.finished.catch(() => {}))); }")
        wallet_card.screenshot(path=f'artifacts/credit-history-ui/collapsed-{width}.png')
    wallet['entries']=[];wallet['hasMore']=False
    page.reload();page.wait_for_load_state('networkidle');toggle.click()
    expect(wallet_card.get_by_text('No credit transactions yet.')).to_be_visible()
    assert not errors,errors
    Path('artifacts/credit-history-ui/results.json').write_text(json.dumps({'passed':['collapsed default','keyboard enter/space','history and source link','pagination retains expanded state','empty history','no overflow at four widths','no page errors'],'widths':[1440,768,390,360],'api':'mocked'},indent=2))
    print('PASS: credit history accordion, keyboard, pagination, empty state and four responsive widths; mocked APIs')
    browser.close()
