import sys,json
from pathlib import Path
sys.path.insert(0,str(Path('.qa-tools').resolve()))
from playwright.sync_api import sync_playwright
state={'archived':False,'role':'admin','writes':[]}
oid='123456789012345678901234'
def handler(route):
    u=route.request.url
    order={'_id':oid,'orderNumber':'GV-TEST','client':{'name':'Test Client'},'paymentStatus':'paid','paymentMethod':'online','orderStatus':'in_progress','amount':1000,'createdAt':'2026-11-03T10:00:00Z','items':[],'archivedAt':'2026-11-03T11:00:00Z' if state['archived'] else None}
    if '/auth/me' in u: data={'user':{'_id':'qa','name':'QA','role':state['role']}}
    elif '/restore' in u:
        state['writes'].append('restore'); state['archived']=False; data={'message':'Restored','order':order}
    elif route.request.method=='DELETE':
        assert route.request.post_data_json['confirmProtected']==True
        state['writes'].append('archive'); state['archived']=True; data={'message':'Archived','order':order}
    elif '/orders/admin' in u or '/orders/staff' in u:
        data={'orders':[order] if ('archived=true' in u)==state['archived'] else []}
    else: data={}
    route.fulfill(status=200,content_type='application/json',body=json.dumps({'success':True,**data}))
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000}); page.route('**/api/**',handler)
    errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:5175/admin/orders'); page.wait_for_load_state('networkidle')
    print(page.locator('body').inner_text()[-2000:])
    page.get_by_role('button',name='Delete order GV-TEST',exact=True).click()
    assert page.get_by_role('alertdialog').get_by_text('Order GV-TEST',exact=False).count()==1
    page.get_by_role('button',name='Cancel',exact=True).click(); assert state['writes']==[]
    page.get_by_role('button',name='Delete order GV-TEST',exact=True).click()
    page.get_by_role('button',name='Review additional warning',exact=True).click(); assert state['writes']==[]
    page.screenshot(path='artifacts/order-archive/protected-confirmation.png',full_page=True)
    page.get_by_role('button',name='Confirm and archive',exact=True).click()
    page.get_by_role('alertdialog').wait_for(state='hidden')
    page.get_by_role('button',name='Delete order GV-TEST',exact=True).wait_for(state='hidden')
    assert state['writes']==['archive']
    page.get_by_role('combobox',name='Order archive view').click(); page.get_by_role('option',name='Archived orders',exact=True).click()
    page.get_by_role('button',name='Restore order GV-TEST',exact=True).wait_for()
    page.set_viewport_size({'width':390,'height':844})
    page.get_by_role('button',name='Restore order GV-TEST',exact=True).click()
    page.get_by_role('button',name='Restore order',exact=True).click()
    page.get_by_role('alertdialog').wait_for(state='hidden'); assert state['writes']==['archive','restore']
    page.get_by_role('combobox',name='Order archive view').click(); page.get_by_role('option',name='Active admin orders',exact=True).click()
    page.get_by_role('button',name='Delete order GV-TEST',exact=True).wait_for()
    page.screenshot(path='artifacts/order-archive/mobile-list.png',full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    state['role']='employee'; page.goto('http://127.0.0.1:5175/staff/orders'); page.wait_for_load_state('networkidle')
    assert page.get_by_role('button',name='Delete order GV-TEST',exact=True).count()==0
    assert page.get_by_role('combobox',name='Order archive view').count()==0
    assert not errors,errors
    print('PASS: cancel, additional confirmation, archive refresh, archive filter, restore, mobile, employee restriction, no page errors')
    Path('artifacts/order-archive/browser-results.json').write_text(json.dumps({'checks':8,'passed':True}))
    browser.close()
