import sys, json, copy
from pathlib import Path
sys.path.insert(0,str(Path('.qa-tools').resolve()))
from playwright.sync_api import sync_playwright, expect
state={'role':'admin','writes':[], 'fail':False}
oid='123456789012345678901234'
iid='123456789012345678901235'
entries=[{'key':str(i),'name':f'Reel {i}','status':'pending','links':[],'notes':'','updatedAt':None} for i in range(1,4)]
order={'_id':oid,'orderNumber':'GV-DELIVERY-QA','client':{'_id':'client','name':'Test Client','email':'qa@example.com'},'paymentStatus':'paid','paymentMethod':'online','orderStatus':'completed','amount':9000,'subtotal':9000,'gstAmount':0,'createdAt':'2026-11-03T10:00:00Z','items':[{'_id':iid,'serviceSnapshot':{'name':'Visual Content ? Reels','slug':'visual-content-reels','category':'Content','repeatableGroups':[]},'quantity':1,'amount':9000,'formData':{},'supportsDelivery':True,'serviceProgress':{'type':'quantity_based','status':'pending_start','displayStatus':'pending_start','deliverables':entries,'totalCount':3,'completedCount':0,'progressPercent':0}}]}
def handler(route):
    u=route.request.url
    if '/auth/me' in u: data={'user':{'_id':'qa','name':'QA','role':state['role']}}
    elif u.endswith('/status') and route.request.method=='PATCH':
        body=route.request.post_data_json
        if order['orderStatus']=='completed': assert body['confirmCompleted'] is True
        assert body['expectedStatus']==order['orderStatus']
        state['writes'].append({'url':u,'body':body})
        order['orderStatus']=body['status']; data={'order':order}
    elif u.endswith('/orders') or u.endswith('/orders/admin') or u.endswith('/orders/staff'): data={'orders':[order]}
    elif '/deliverables/' in u:
        if state['fail']:
            route.fulfill(status=409,content_type='application/json',body=json.dumps({'message':'This deliverable changed. Refresh the order before editing again.'}));return
        body=route.request.post_data_json; state['writes'].append({'url':u,'body':body}); entry=next(e for e in entries if e['key']==u.split('/')[-1]);entry.update(body)
        entry['updatedAt']='2026-11-03T12:00:00Z'
        progress=order['items'][0]['serviceProgress'];progress['completedCount']=sum(e['status']=='completed' for e in entries)
        progress['progressPercent']=sum({'pending':0,'in_progress':50,'completed':100}[e['status']] for e in entries)/3
        progress['displayStatus']='completed' if progress['completedCount']==3 else 'in_progress'
        order['orderStatus']=progress['displayStatus'];data={'order':order,'message':'Deliverable saved.'}
    elif '/employees' in u: data={'employees':[]}
    elif '/ad-credit' in u: data={'balances':{'metaAds':0,'googleAds':0}}
    elif '/orders/' in u: data={'order':order}
    else:data={}
    route.fulfill(status=200,content_type='application/json',body=json.dumps({'success':True,**data}))
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000});page.route('**/api/**',handler)
    page.route('https://fonts.googleapis.com/**',lambda route:route.abort());page.route('https://fonts.gstatic.com/**',lambda route:route.abort())
    page.route('**/*',lambda route: handler(route) if '/api/' in route.request.url else route.continue_() if route.request.url.startswith('http://127.0.0.1:5175/') else route.abort())
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    for role,path in [('admin','admin'),('employee','staff')]:
        state['role']=role;order['orderStatus']='completed'
        page.goto(f'http://127.0.0.1:5175/{path}/orders/{oid}');page.wait_for_load_state('networkidle')
        select=page.get_by_role('combobox',name='Order status',exact=True)
        expect(select).to_have_text('Completed',use_inner_text=True)
        Path(f'artifacts/order-status/{role}-dom.txt').write_text(page.locator('body').inner_text(),encoding='utf-8')
        before=len(state['writes'])
        select.click();page.get_by_role('option',name='Pending',exact=True).click()
        dialog=page.get_by_role('alertdialog');expect(dialog).to_be_visible()
        expect(dialog).to_contain_text('GV-DELIVERY-QA')
        assert len(state['writes'])==before
        dialog.get_by_role('button',name='Cancel',exact=True).click()
        assert len(state['writes'])==before
        for status,label in [('pending','Pending'),('in_progress','In Progress'),('on_hold','On Hold')]:
            if order['orderStatus']!='completed':
                select.click();page.get_by_role('option',name='Completed',exact=True).click()
                expect(select).to_have_text('Completed',use_inner_text=True)
            select.click();page.get_by_role('option',name=label,exact=True).click()
            expect(dialog).to_be_visible()
            if status=='pending':dialog.screenshot(path=f'artifacts/order-status/{role}-confirmation.png')
            dialog.get_by_role('button',name='Change Status',exact=True).click()
            expect(dialog).not_to_be_visible();expect(select).to_have_text(label,use_inner_text=True)
            assert order['paymentStatus']=='paid'
            assert f'/{path}/' in state['writes'][-1]['url']
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    state['role']='client'
    page.goto(f'http://127.0.0.1:5175/dashboard/orders/{oid}');page.wait_for_load_state('networkidle')
    expect(page.get_by_text('On Hold',exact=True).first).to_be_visible()
    assert page.get_by_role('combobox',name='Order status',exact=True).count()==0
    order['orderStatus']='in_progress'
    page.evaluate("window.dispatchEvent(new Event('orders:status-changed'))")
    expect(page.get_by_text('In Progress',exact=True).first).to_be_visible()
    assert not errors,errors
    Path('artifacts/order-status/browser-results.json').write_text(json.dumps({'passed':['admin confirmation and cancel','employee confirmation and cancel','admin complete to pending/in progress/on hold','employee complete to pending/in progress/on hold','payment unchanged','client read-only status','client refresh event','390px no overflow','no page errors']},indent=2))
    print('PASS: 9 status-change browser checks with mocked APIs')
    browser.close()
