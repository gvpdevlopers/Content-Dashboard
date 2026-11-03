import sys, json, copy
from pathlib import Path
sys.path.insert(0,str(Path('.qa-tools').resolve()))
from playwright.sync_api import sync_playwright, expect
state={'role':'admin','writes':[], 'fail':False}
oid='123456789012345678901234'
iid='123456789012345678901235'
entries=[{'key':str(i),'name':f'Reel {i}','status':'pending','links':[],'notes':'','updatedAt':None} for i in range(1,4)]
order={'_id':oid,'orderNumber':'GV-DELIVERY-QA','client':{'_id':'client','name':'Test Client','email':'qa@example.com'},'paymentStatus':'paid','paymentMethod':'online','orderStatus':'processing','amount':9000,'subtotal':9000,'gstAmount':0,'createdAt':'2026-11-03T10:00:00Z','items':[{'_id':iid,'serviceSnapshot':{'name':'Visual Content ? Reels','slug':'visual-content-reels','category':'Content','repeatableGroups':[]},'quantity':1,'amount':9000,'formData':{},'supportsDelivery':True,'serviceProgress':{'type':'quantity_based','status':'pending_start','displayStatus':'pending_start','deliverables':entries,'totalCount':3,'completedCount':0,'progressPercent':0}}]}
def handler(route):
    u=route.request.url
    if '/auth/me' in u: data={'user':{'_id':'qa','name':'QA','role':state['role']}}
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
    page=browser.new_page(viewport={'width':1440,'height':1000}); page.route('**/api/**',handler); page.route('https://fonts.googleapis.com/**',lambda route: route.abort()); page.route('https://fonts.gstatic.com/**',lambda route: route.abort())
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(f'http://127.0.0.1:5175/admin/orders/{oid}');page.wait_for_load_state('networkidle')
    section=page.get_by_role('region',name='Service deliverables',exact=True)
    expect(section.get_by_role('article')).to_have_count(3,timeout=30000)
    first=section.get_by_role('article',name='Reel 1',exact=True)
    first.get_by_role('button',name='Edit Reel 1',exact=True).click()
    first.get_by_role('combobox',name='Progress status',exact=True).click()
    page.get_by_role('option',name='Completed',exact=True).click()
    for label,url in [('Final video','https://example.com/final.mp4'),('Thumbnail','https://example.com/thumbnail.png')]:
        first.get_by_role('button',name='Add link',exact=True).click()
        first.get_by_label('label (optional)',exact=False).last.fill(label)
        first.get_by_label('URL',exact=False).last.fill(url)
    first.get_by_label('Notes (visible to the client)',exact=True).fill('Approved final files')
    first.get_by_role('button',name='Save deliverable',exact=True).click()
    first.get_by_text('Deliverable saved.',exact=True).wait_for()
    assert len(state['writes'])==1 and len(entries[0]['links'])==2
    assert entries[1]['status']=='pending' and entries[2]['status']=='pending'
    assert first.get_by_role('link',name='Open Final video for Reel 1').get_attribute('href')=='https://example.com/final.mp4'
    # Cancel a removal, then replace the first link and remove the thumbnail.
    first.get_by_role('button',name='Edit Reel 1',exact=True).click()
    first.get_by_role('button',name='Remove link 2 from Reel 1',exact=True).click()
    first.get_by_role('button',name='Cancel',exact=True).click()
    assert len(state['writes'])==1
    first.get_by_role('button',name='Edit Reel 1',exact=True).click()
    first.get_by_label('Link 1 URL',exact=True).fill('https://example.com/revised.mp4')
    first.get_by_role('button',name='Remove link 2 from Reel 1',exact=True).click()
    first.get_by_role('button',name='Save deliverable',exact=True).click()
    first.get_by_text('Deliverable saved.',exact=True).wait_for()
    assert len(entries[0]['links'])==1 and entries[0]['links'][0]['url'].endswith('revised.mp4')
    # A conflicting server write retains the unsaved draft.
    first.get_by_role('button',name='Edit Reel 1',exact=True).click()
    first.get_by_label('Notes (visible to the client)',exact=True).fill('Unsaved draft retained')
    state['fail']=True
    first.get_by_role('button',name='Save deliverable',exact=True).click()
    first.get_by_role('alert').wait_for()
    assert first.get_by_label('Notes (visible to the client)',exact=True).input_value()=='Unsaved draft retained'
    first.get_by_role('button',name='Cancel',exact=True).click();state['fail']=False
    section.screenshot(path='artifacts/deliverables/admin-desktop.png')
    # Employee uses the staff endpoint and changes only Reel 2.
    state['role']='employee'
    page.goto(f'http://127.0.0.1:5175/staff/orders/{oid}');page.wait_for_load_state('networkidle')
    section=page.get_by_role('region',name='Service deliverables',exact=True)
    second=section.get_by_role('article',name='Reel 2',exact=True)
    second.get_by_role('button',name='Edit Reel 2',exact=True).click()
    second.get_by_role('combobox',name='Progress status',exact=True).click()
    page.get_by_role('option',name='In Progress',exact=True).click()
    second.get_by_role('button',name='Add link',exact=True).click()
    second.get_by_label('Link 1 URL',exact=True).fill('https://example.com/reel-2')
    for width in [1440,768,390,360]:
        page.set_viewport_size({'width':width,'height':900})
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),width
    second.screenshot(path='artifacts/deliverables/employee-mobile-editor.png')
    second.get_by_role('button',name='Save deliverable',exact=True).click()
    second.get_by_text('Deliverable saved.',exact=True).wait_for()
    assert '/staff/' in state['writes'][-1]['url']
    assert page.get_by_role('progressbar',name='Service progress',exact=True).get_attribute('aria-valuenow')=='50'
    # Client sees separate deliveries, progress and links, without an editor.
    state['role']='client'
    page.goto(f'http://127.0.0.1:5175/dashboard/orders/{oid}');page.wait_for_load_state('networkidle')
    section=page.get_by_role('region',name='Service deliverables',exact=True)
    expect(section.get_by_role('article')).to_have_count(3,timeout=30000)
    assert section.get_by_role('button').count()==0
    assert section.get_by_role('link').count()==2
    for width in [1440,768,390,360]:
        page.set_viewport_size({'width':width,'height':900})
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),width
    section.screenshot(path='artifacts/deliverables/client-mobile.png')
    assert not errors,errors
    Path('artifacts/deliverables/browser-results.json').write_text(json.dumps({'passed':['three output rows','admin creates two labeled links','one output update leaves siblings unchanged','cancel discards removal','replace and remove link','conflict preserves unsaved draft','employee uses staff endpoint','weighted progress shown','client read-only links','1440/768/390/360 no overflow','no page errors']},indent=2))
    print('PASS: 11 deliverable browser checks; mocked API responses')
    browser.close()
