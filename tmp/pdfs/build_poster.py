from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from pathlib import Path

OUT=Path('output/pdf'); OUT.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('UI','C:/Windows/Fonts/segoeui.ttf'))
pdfmetrics.registerFont(TTFont('Bold','C:/Windows/Fonts/segoeuib.ttf'))
W,H=841.89,1190.55
c=canvas.Canvas(str(OUT/'SolarCoop-Marketing-Poster-A3.pdf'),pagesize=(W,H))
c.setTitle('SolarCoop | Power your home. Empower your community.')
navy='#071124'; gold='#FFB313'; teal='#22CFBE'; white='#F5F8FF'; muted='#B6C5D9'
def box(x,y,w,h,fill,r=0,stroke=None):
 c.setFillColor(HexColor(fill)); c.setStrokeColor(HexColor(stroke or fill)); c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=bool(stroke))
def text(x,y,s,size=12,color=white,font='UI'):
 c.setFillColor(HexColor(color));c.setFont(font,size);c.drawString(x,H-y-size,s)
def line(x,y,x2,y2,color=teal,width=1):
 c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x,H-y,x2,H-y2)
box(0,0,W,H,navy)
# Quiet geometric solar motif keeps the typography and app screens dominant.
c.setStrokeColor(HexColor('#16273B'));c.setLineWidth(1)
for r in [120,170,220,270]: c.circle(790,H-85,r,stroke=1,fill=0)
box(42,40,43,43,'#352D17',12, '#8A661B')
p=c.beginPath();p.moveTo(66,H-48);p.lineTo(54,H-64);p.lineTo(64,H-64);p.lineTo(59,H-76);p.lineTo(75,H-59);p.lineTo(65,H-59);p.close()
c.setFillColor(HexColor(gold));c.drawPath(p,fill=1,stroke=0)
text(97,37,'SolarCoop',28,font='Bold');text(98,73,'COMMUNITY ENERGY SHARING',9,teal,'Bold')
text(609,52,'SMARTER HOMES.',11,muted,'Bold');text(609,69,'STRONGER COMMUNITIES.',11,muted,'Bold')
text(42,112,'Your sunshine.',54,font='Bold')
text(42,172,'Our shared power.',54,gold,'Bold')
text(44,250,'Monitor your solar. Share your surplus. Make every unit count.',18,white)
text(44,282,'Community Energy Sharing & Solar Co-op App  |  Topic 14',13,muted)

shots=Path('C:/Users/P R E D A T O R/OneDrive/Pictures/Screenshots')
for x,stamp,label in [(84,'112933','MONITOR'),(337,'113022','SHARE'),(590,'113011','SEE YOUR IMPACT')]:
 box(x-7,321,175,383,'#020713',22,'#35465E')
 # Original screenshots are placed intact; demonstration values are not marketing claims.
 c.drawImage(ImageReader(str(shots/f'Screenshot 2026-10-13 {stamp}.png')),x,H-330-365,width=161,height=365,mask='auto')
 text(x+4,713,label,11,gold,'Bold')

text(44,750,'DESIGNED FOR A CLEANER, CONNECTED COMMUNITY',12,teal,'Bold')
for x,num,title,color,rows in [
 (44,'7','Affordable and Clean Energy','#FCC30B',['Monitor solar generation, usage and battery levels.','Share surplus energy and compare co-op rates.','Support better use of locally generated clean power.']),
 (434,'11','Sustainable Cities and Communities','#FD9D24',['Connect households around a shared energy resource.','Coordinate energy requests and track transactions.','Support community resilience through co-operation.'])]:
 box(x,779,364,126,'#122137',12,'#2D4057')
 box(x+12,791,39,39,color,6)
 text(x+20,795,num,24,navy,'Bold')
 text(x+63,790,'SDG '+num,10,color,'Bold')
 text(x+63,807,title,13,white,'Bold')
 for i,row in enumerate(rows): text(x+14,842+i*17,row,10.5,muted)
text(44,924,'One community. A shared energy future.',23,white,'Bold')
text(44,958,'Multiple households jointly manage and monitor a shared energy resource.',12,muted)
text(44,978,'Live insights  /  Peer-to-peer sharing  /  Alerts & support  /  English, Sinhala & Tamil',11,teal)
line(44,1005,798,1005,'#26364B')
text(44,1017,'Group_044  |  Leader\'s group: Y3.S2.WE.SE.0201',12,white,'Bold')
text(44,1040,'IT23701946  G.V.D Perera     |     IT23744448  Menuka B.P',10.5,muted)
text(44,1057,'IT23773844  T.P.Lakpriya       |     IT23638068  Shaveen K.K.I',10.5,muted)
box(0,1080,W,111,'#102B35')
text(44,1093,'Explore SolarCoop',24,white,'Bold')
text(44,1128,'Scan to view the project and setup instructions.',12,muted)
text(44,1153,'Project enquiries: github.com/thrakaprabash/SolarCoop/issues',10,muted)
box(718,1090,88,88,'#FFFFFF',7)
url='https://github.com/thrakaprabash/SolarCoop'
qr=QrCodeWidget(url); a,b,xx,yy=qr.getBounds();d=Drawing(80,80,transform=[80/(xx-a),0,0,80/(yy-b),0,0]);d.add(qr);renderPDF.draw(d,c,722,H-1094-80)
text(44,734,'Screens show demonstration data.',8,'#8298B0')
c.save()
print(OUT/'SolarCoop-Marketing-Poster-A3.pdf')
