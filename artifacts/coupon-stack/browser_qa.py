import sys,json
from pathlib import Path
sys.path.insert(0,str(Path('.qa-tools').resolve()))
from playwright.sync_api import sync_playwright
sid='123456789012345678901234'
service={'_id':sid,'name':'Reels','slug':'reels','category':'Content','serviceGroup':'content','isActive':True,'pricingType':'fixed','basePrice':0,'minQuantity':1,'pricingOptions':[],'repeatableGroups':[],'fields':[{'name':'voice','label':'Voice-over','type':'select','required':True,'options':[{'value':'yes','label':'Voice-over','price':2500}]}]}
draft={'_id':'123456789012345678901235','title':'Coupon draft','services':[{'serviceId':sid,'quantity':1,'formData':{'voice':'yes'}}],'couponCodes':['SERVICE20','VOICE1000'],'createdAt':'2026-11-03T10:00:00Z','updatedAt':'2026-11-03T10:00:00Z','additionalRequirements':''}
requests=[]
def handler(route):
    u=route.request.url
    if '/auth/me' in u: data={'user':{'_id':'qa','name':'QA Client','role':'client','serviceAccess':{'mode':'groups','groups':['content']}}}
    elif '/services' in u: data={'services':[service]}
    elif '/drafts' in u:
        if route.request.method in ['PATCH','POST']:
            requests.append(route.request.post_data_json); data={'draft':{**draft,**requests[-1]},'message':'Draft saved'}
        else: data={'drafts':[draft]} if u.endswith('/drafts') else {'draft':draft,'accessIssues':[]}
    elif '/payment-pricing' in u: data={'gstRates':{'cod':0,'online':18,'chequeWithGst':18,'chequeDirectCollection':0,'month_end':18}}
    elif 'coupon-quote' in u or '/orders/quote' in u:
        body=route.request.post_data_json; codes=body.get('couponCodes',[]); requests.append(body)
        if 'INVALID' in codes:
            route.fulfill(status=400,content_type='application/json',body=json.dumps({'success':False,'message':'INVALID: This coupon has expired.'})); return
        amount=2500; snapshots=[]
        for code in codes:
            discount=amount*.2 if code=='SERVICE20' else min(1000,amount)
            line={'serviceId':sid,'serviceName':'Reels','discountPercent':20 if code=='SERVICE20' else 0,'discountType':'percentage' if code=='SERVICE20' else 'fixed','originalAmount':amount,'eligibleAmount':amount,'discountAmount':discount,'discountedAmount':amount-discount,'optionBreakdown':[]}
            amount-=discount; snapshots.append({'code':code,'discountTotal':discount,'serviceBreakdown':[line]})
        totaldiscount=2500-amount; rate=18 if body.get('paymentMethod')=='online' else 0
        data={'quote':{'code':' + '.join(codes),'coupons':snapshots,'originalSubtotal':2500,'discountTotal':totaldiscount,'taxableSubtotal':amount,'gstRate':rate,'gstAmount':round(amount*rate/100,2),'finalTotal':round(amount*(1+rate/100),2),'amount':round(amount*(1+rate/100),2),'serviceBreakdown':[{'serviceId':sid,'serviceName':'Reels','discountType':'combined','discountPercent':0,'discountAmount':totaldiscount,'originalAmount':2500,'eligibleAmount':2500,'discountedAmount':amount,'optionBreakdown':[]}]}}
    elif '/latest' in u: data={'order':None}
    elif '/packages' in u: data={'packages':[]}
    elif '/ad-credit' in u: data={'balances':{'metaAds':0,'googleAds':0}}
    else: data={}
    route.fulfill(status=200,content_type='application/json',body=json.dumps({'success':True,**data}))
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000}); page.route('**/api/**',handler)
    errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:5175/dashboard/new-order'); page.wait_for_load_state('networkidle')
    page.get_by_role('button',name='Resume',exact=True).click()
    page.get_by_role('button',name='Remove coupon SERVICE20',exact=True).wait_for(state='attached')
    page.get_by_text('SERVICE20 + VOICE1000 applied successfully.',exact=True).wait_for()
    assert requests[-1]['couponCodes']==['SERVICE20','VOICE1000']
    page.get_by_role('button',name='Remove coupon VOICE1000',exact=True).click()
    page.get_by_text('SERVICE20 applied successfully.',exact=True).wait_for()
    assert requests[-1]['couponCodes']==['SERVICE20']
    page.locator('#order-coupon-code').fill('VOICE1000'); page.get_by_role('button',name='Add coupon',exact=True).click()
    page.get_by_text('SERVICE20 + VOICE1000 applied successfully.',exact=True).wait_for()
    assert requests[-1]['couponCodes']==['SERVICE20','VOICE1000']
    page.locator('#order-coupon-code').fill('SERVICE20'); page.get_by_role('button',name='Add coupon',exact=True).click()
    page.get_by_text('This coupon is already added.',exact=True).wait_for()
    assert page.get_by_role('button',name='Remove coupon SERVICE20',exact=True).count()==1
    page.locator('#order-coupon-code').fill('INVALID'); page.get_by_role('button',name='Add coupon',exact=True).click()
    page.get_by_text('INVALID: This coupon has expired.',exact=True).wait_for()
    page.get_by_role('button',name='Remove coupon INVALID',exact=True).click()
    page.get_by_text('SERVICE20 + VOICE1000 applied successfully.',exact=True).wait_for()
    page.get_by_role('button',name='Pay Online',exact=True).click()
    page.get_by_text('18% on subtotal',exact=False).wait_for()
    page.get_by_text('SERVICE20 + VOICE1000 applied successfully.',exact=True).wait_for()
    assert requests[-1]['paymentMethod']=='online'
    page.get_by_role('button',name='Update Draft',exact=True).first.click()
    page.get_by_text('Draft saved',exact=False).first.wait_for()
    assert any(r.get('title') is not None and r.get('couponCodes')==['SERVICE20','VOICE1000'] for r in requests)
    page.screenshot(path='artifacts/coupon-stack/desktop.png',full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    review=page.get_by_role('button',name='Review order',exact=False)
    if review.count() and review.first.is_visible(): review.first.click()
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path='artifacts/coupon-stack/mobile.png',full_page=True)
    assert not errors,errors
    Path('artifacts/coupon-stack/browser-results.json').write_text(json.dumps({'passed':['draft restores both coupons','remove keeps remaining coupon','add second coupon','duplicate blocked','invalid coupon removable','online GST revalidation','draft saves coupon array','390px no overflow','no page errors']},indent=2))
    print('PASS: 9 multi-coupon browser checks; mocked APIs only')
    browser.close()
