// Ratings assess each player's Manchester United contribution through 2024/25.
// Appearance estimates are used only for chemistry; they are not official totals.
const ERAS = ['Pre-war','1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s'];
const rawPlayers = `
Harry Moger|GK|81|1903|1912|Pre-war
Jack Crompton|GK|76|1937|1949|Pre-war
Dick Duckworth|RB/CB|81|1903|1915|Pre-war
George Stacey|LB|80|1907|1919|Pre-war
Charlie Roberts|CB/DM|87|1904|1913|Pre-war
Alex Bell|DM/CM|79|1903|1913|Pre-war
George Wall|LW/LM|82|1906|1915|Pre-war
Billy Meredith|RW/RM|90|1906|1921|Pre-war
Sandy Turnbull|ST|88|1906|1915|Pre-war
Joe Spence|RW/ST|86|1919|1933|Pre-war
George Mutch|ST|78|1934|1946|Pre-war
Johnny Carey|RB/CB|89|1936|1953|Pre-war
Charlie Mitten|LW/LM|82|1936|1951|Pre-war
Stan Pearson|ST/AM|85|1935|1954|Pre-war
Jack Rowley|ST/LW|87|1937|1955|Pre-war
Charlie Sagar|ST|77|1903|1909|Pre-war
Jimmy Turnbull|ST|77|1907|1910|Pre-war
Harry Stafford|RB/CB|80|1896|1903|Pre-war
Clarence Hilditch|CM/DM|78|1916|1932|Pre-war
John Silcock|LB|76|1919|1934|Pre-war
Frank Barson|CB|79|1922|1928|Pre-war
Hugh McLenahan|CM|76|1927|1937|Pre-war
Arthur Lochhead|ST|78|1924|1928|Pre-war
Ray Wood|GK|83|1949|1958|1950s
Harry Gregg|GK|86|1957|1966|1950s
Roger Byrne|LB|89|1949|1958|1950s
Bill Foulkes|CB/RB|88|1952|1970|1950s
Mark Jones|CB|82|1950|1958|1950s
Geoff Bent|LB|75|1948|1958|1950s
Duncan Edwards|CM/DM|92|1953|1958|1950s
Eddie Colman|CM|83|1952|1958|1950s
Bobby Charlton|AM/CM/LW/ST|94|1956|1973|1950s
David Pegg|LW/LM|84|1952|1958|1950s
Liam Whelan|AM/ST/CM|82|1953|1958|1950s
Tommy Taylor|ST|90|1953|1958|1950s
Dennis Viollet|ST|88|1950|1962|1950s
Albert Scanlon|LW|80|1954|1960|1950s
Johnny Berry|RW/RM|84|1951|1958|1950s
Jackie Blanchflower|CM/DM/CB|83|1951|1958|1950s
Kenny Morgans|RW|75|1957|1961|1950s
Ian Greaves|RB|75|1953|1960|1950s
Freddie Goodwin|CB|76|1953|1960|1950s
Ronnie Cope|CB|75|1957|1961|1950s
Colin Webster|ST|75|1953|1960|1950s
Alex Dawson|ST|77|1957|1961|1950s
Shay Brennan|LB/RB|85|1957|1970|1950s
Ernie Taylor|AM|76|1958|1960|1950s
Stan Crowther|DM/CM|73|1958|1959|1950s
Alex Stepney|GK|89|1966|1978|1960s
David Gaskell|GK|76|1956|1969|1960s
Tony Dunne|LB/RB|88|1960|1973|1960s
Pat Crerand|CM/DM|87|1963|1971|1960s
Nobby Stiles|DM/CB|88|1960|1971|1960s
George Graham|CM|74|1964|1966|1960s
George Best|RW/LW|94|1963|1974|1960s
Denis Law|ST|93|1962|1973|1960s
David Herd|ST|84|1961|1968|1960s
Brian Greenhoff|CB/DM|82|1968|1979|1960s
Jimmy Rimmer|GK|76|1963|1974|1960s
Francis Burns|LB|77|1965|1972|1960s
John Fitzpatrick|RB|77|1961|1973|1960s
Willie Morgan|RW|81|1968|1975|1960s
David Sadler|CB|79|1963|1973|1960s
John Connelly|RW|81|1964|1966|1960s
Albert Quixall|AM/CM/RM|80|1958|1964|1960s
Johnny Giles|CM|78|1957|1963|1960s
Maurice Setters|DM/CM/CB|78|1960|1964|1960s
Noel Cantwell|LB/CB|82|1960|1967|1960s
Brian Kidd|ST|81|1967|1974|1960s
Ian Ure|CB|72|1969|1971|1960s
John Aston Jr|LW/RW|84|1965|1972|1960s
John Connaughton|GK|74|1972|1974|1970s
Paddy Roche|GK|76|1973|1977|1970s
Martin Buchan|CB|87|1972|1983|1970s
Stewart Houston|LB|79|1973|1980|1970s
Jimmy Greenhoff|ST/AM|81|1976|1980|1970s
Lou Macari|CM/AM|84|1973|1984|1970s
Steve Coppell|RW|86|1975|1983|1970s
Gordon Hill|LW|80|1975|1978|1970s
Stuart Pearson|ST|79|1974|1979|1970s
Sammy McIlroy|CM/AM|85|1971|1982|1970s
Steve James|CB|78|1968|1975|1970s
Mickey Thomas|RM/CM|75|1978|1981|1970s
David McCreery|DM/CM|75|1974|1979|1970s
Jimmy Nicholl|RB|77|1974|1982|1970s
Joe Jordan|ST|81|1978|1981|1970s
Alex Forsyth|RB|78|1972|1978|1970s
Jimmy Holton|CB|78|1972|1976|1970s
Ian Storey-Moore|ST|75|1972|1974|1970s
Jim McCalliog|CM|78|1974|1977|1970s
David Greenhoff|CB|81|1971|1979|1970s
Andy Ritchie|ST|74|1977|1980|1970s
Mick Martin|CM|74|1973|1975|1970s
Tony Young|RB|73|1968|1973|1970s
Jim Leighton|GK|78|1988|1990|1980s
Gary Bailey|GK|86|1978|1987|1980s
Gordon McQueen|CB|82|1978|1985|1980s
Paul McGrath|CB|89|1982|1989|1980s
Kevin Moran|CB|83|1978|1988|1980s
Arthur Albiston|LB|85|1974|1988|1980s
Clayton Blackmore|RB/LB|80|1982|1994|1980s
Bryan Robson|CM/DM|93|1981|1994|1980s
Ray Wilkins|CM|85|1979|1984|1980s
Norman Whiteside|AM/ST|87|1982|1989|1980s
Mark Hughes|ST|90|1983|1995|1980s
Jesper Olsen|LW|80|1984|1988|1980s
Alan Brazil|ST|72|1984|1986|1980s
Ralph Milne|LW|70|1988|1991|1980s
Neil Webb|CM|75|1989|1992|1980s
Remi Moses|DM|78|1981|1988|1980s
Frank Stapleton|ST|84|1981|1987|1980s
Mike Duxbury|RB|81|1980|1990|1980s
Lee Martin|LB|78|1988|1994|1980s
Mal Donaghy|CB/LB|80|1988|1992|1980s
Chris Turner|GK|76|1985|1988|1980s
Viv Anderson|RB|81|1987|1991|1980s
Mark Robins|ST|78|1988|1992|1980s
Brian McClair|ST/AM/CM/RM|87|1987|1998|1980s
Russell Beardsmore|RW|74|1986|1993|1980s
Paul Ince|CM/DM|86|1989|1995|1980s
Peter Davenport|ST|77|1986|1988|1980s
Liam O'Brien|CM|72|1987|1988|1980s
Colin Gibson|LB|76|1985|1990|1980s
Les Sealey|GK|79|1990|1994|1990s
Mike Phelan|CM/RB|80|1989|1994|1990s
Danny Wallace|LW/ST|72|1989|1993|1990s
Paul Parker|RB|84|1991|1996|1990s
Peter Schmeichel|GK|93|1991|1999|1990s
Gary Neville|RB|89|1992|2011|1990s
Denis Irwin|LB/RB|91|1990|2002|1990s
Steve Bruce|CB|89|1987|1996|1990s
Gary Pallister|CB|89|1989|1998|1990s
Jaap Stam|CB|90|1998|2001|1990s
David Beckham|RM/RW/CM|91|1992|2003|1990s
Roy Keane|CM/DM|92|1993|2005|1990s
Paul Scholes|CM/AM|92|1994|2013|1990s
Ryan Giggs|LM/LW/RM/CM|92|1990|2014|1990s
Eric Cantona|ST/AM|92|1992|1997|1990s
Andy Cole|ST|89|1995|2001|1990s
Dwight Yorke|ST|88|1998|2002|1990s
Ole Gunnar Solskjaer|ST|86|1996|2007|1990s
Nicky Butt|DM/CM|84|1992|2004|1990s
Mark Bosnich|GK|73|1999|2001|1990s
Ronny Johnsen|CB/DM|84|1996|2002|1990s
Phil Neville|LB/RB|83|1995|2005|1990s
David May|CB|77|1994|2003|1990s
Lee Sharpe|LM/LW/RM|84|1988|1996|1990s
Teddy Sheringham|ST/AM|85|1997|2001|1990s
Jordi Cruyff|AM/LW|73|1996|2000|1990s
Raimond van der Gouw|GK|79|1996|2002|1990s
Kevin Pilkington|GK|71|1993|1998|1990s
Dion Dublin|ST|73|1992|1994|1990s
Andrei Kanchelskis|RW|86|1991|1995|1990s
Jesper Blomqvist|LM/LW|78|1998|2001|1990s
William Prunier|CB|70|1995|1996|1990s
Edwin van der Sar|GK|91|2005|2011|2000s
Ben Foster|GK|74|2005|2010|2000s
Rio Ferdinand|CB|92|2002|2014|2000s
Nemanja Vidić|CB|92|2006|2014|2000s
Wes Brown|RB/CB|84|1998|2011|2000s
Patrice Evra|LB|89|2006|2014|2000s
John O'Shea|LB/RB/CB|83|1999|2011|2000s
Michael Carrick|CM/DM|90|2006|2018|2000s
Darren Fletcher|CM/DM|85|2003|2015|2000s
Owen Hargreaves|DM/CM/RM/RW|80|2007|2011|2000s
Ruud van Nistelrooy|ST|92|2001|2006|2000s
Cristiano Ronaldo|RW/LW/ST|94|2003|2009|2000s
Wayne Rooney|ST/AM/LW|94|2004|2017|2000s
Carlos Tévez|ST/AM|87|2007|2009|2000s
Dimitar Berbatov|ST|86|2008|2012|2000s
Nani|RW/LW|85|2007|2015|2000s
Rafael da Silva|RB|83|2008|2015|2000s
Fábio da Silva|LB/RB|75|2008|2014|2000s
Ji-sung Park|RM/CM|85|2005|2012|2000s
Anderson|CM|77|2007|2015|2000s
Tomasz Kuszczak|GK|78|2006|2012|2000s
Louis Saha|ST|83|2004|2008|2000s
Alan Smith|ST/CM|77|2004|2007|2000s
Gabriel Heinze|LB/CB|82|2004|2007|2000s
Kieran Richardson|LM/LB|77|2002|2007|2000s
Mikaël Silvestre|LB/CB|82|1999|2008|2000s
Federico Macheda|ST|73|2008|2014|2000s
Darron Gibson|CM|75|2005|2012|2000s
Chris Eagles|RW|71|2003|2008|2000s
Mame Biram Diouf|ST|70|2009|2012|2000s
David de Gea|GK|91|2011|2023|2010s
Sergio Romero|GK|80|2015|2021|2010s
Chris Smalling|CB|83|2010|2019|2010s
Jonny Evans|CB|82|2006|2015|2010s
Phil Jones|CB/RB|77|2011|2023|2010s
Luke Shaw|LB|82|2014|2024|2010s
Antonio Valencia|RB/RM/RW|86|2009|2019|2010s
Ashley Young|LM/RM/LB|81|2011|2020|2010s
Ander Herrera|CM/DM|83|2014|2019|2010s
Juan Mata|AM/RW|82|2014|2022|2010s
Paul Pogba|CM|80|2016|2022|2010s
Marouane Fellaini|CM/AM|78|2013|2019|2010s
Zlatan Ibrahimović|ST|84|2016|2018|2010s
Marcus Rashford|LW/ST|85|2016|2024|2010s
Anthony Martial|ST/LW|80|2015|2024|2010s
Romelu Lukaku|ST|81|2017|2019|2010s
Jesse Lingard|AM/RW|78|2014|2022|2010s
Bébé|RW/ST|70|2010|2014|2010s
Robin van Persie|ST|89|2012|2015|2010s
Victor Valdés|GK|70|2015|2016|2010s
Daley Blind|LB/CB|81|2014|2018|2010s
Marcos Rojo|CB/LB|76|2014|2021|2010s
Matteo Darmian|RB/LB|76|2015|2019|2010s
Memphis Depay|LW/ST|73|2015|2017|2010s
Henrikh Mkhitaryan|AM/RW|77|2016|2018|2010s
Shinji Kagawa|AM/LW|75|2012|2014|2010s
Bastian Schweinsteiger|CM/DM|74|2015|2017|2010s
Radamel Falcao|ST|71|2014|2015|2010s
Daniel James|RW/LW|75|2019|2021|2010s
Scott McTominay|CM/DM|79|2017|2024|2010s
Fred|CM|79|2018|2023|2010s
Ángel Di María|RW/AM|85|2014|2015|2010s
Alexis Sánchez|LW/ST|82|2018|2020|2010s
Sofyan Amrabat|DM/CM|76|2023|2024|2020s
André Onana|GK|76|2023|2025|2020s
Dean Henderson|GK|74|2020|2023|2020s
Diogo Dalot|RB/LB|83|2018|2025|2020s
Aaron Wan-Bissaka|RB|80|2019|2024|2020s
Harry Maguire|CB|80|2019|2025|2020s
Lisandro Martínez|CB|82|2022|2025|2020s
Raphaël Varane|CB|81|2021|2024|2020s
Noussair Mazraoui|RB/LB|79|2024|2025|2020s
Casemiro|DM|82|2022|2025|2020s
Bruno Fernandes|AM/CM|91|2020|2025|2020s
Kobbie Mainoo|CM/DM|83|2022|2025|2020s
Christian Eriksen|CM/AM|78|2022|2025|2020s
Alejandro Garnacho|LW/RW|78|2022|2025|2020s
Amad Diallo|RW/AM|80|2021|2025|2020s
Rasmus Højlund|ST|77|2023|2025|2020s
Jadon Sancho|RW/LW|80|2021|2024|2020s
Mason Mount|AM/CM|73|2023|2025|2020s
Antony|RW|71|2022|2025|2020s
Donny van de Beek|CM/AM|72|2020|2024|2020s
Tyrell Malacia|LB|73|2022|2025|2020s
Joshua Zirkzee|ST/AM|75|2024|2025|2020s
`.trim();
const LOW_USAGE = new Set(['Bébé','William Prunier','Victor Valdés','Radamel Falcao','Mame Biram Diouf','Chris Eagles','Kevin Pilkington','Stan Crowther','Ernie Taylor','Dion Dublin','Jordi Cruyff','Mason Mount','Donny van de Beek','Tyrell Malacia']);
const APPEARANCE_ESTIMATES = {'Bébé':2,'William Prunier':2,'Victor Valdés':2,'Chris Eagles':6,'Mame Biram Diouf':5,'Owen Hargreaves':39,'Phil Jones':229,'Ángel Di María':27,'Alexis Sánchez':35,'Jadon Sancho':83,'Sofyan Amrabat':21,'Les Sealey':19,'Danny Wallace':30,'Radamel Falcao':26,'André Onana':90,'Antony':75,'Donny van de Beek':27,'Mason Mount':35};
const PLAYERS = rawPlayers.split('\n').map(line=>{const [name,positions,ratingText,from,to,era]=line.split('|');const seasons=+to-+from+1;const rating=+ratingText;const apps=APPEARANCE_ESTIMATES[name]??(LOW_USAGE.has(name)?Math.min(65,seasons*12):Math.round(seasons*(rating>=90?39:rating>=84?33:rating>=76?25:rating>=68?16:8)));return {name,pos:positions.split('/'),rating,apps,from:+from,to:+to,era,id:name+'-'+era}});
const MANAGERS = [
  {name:'Ernest Mangnall',from:1903,to:1912,perk:'Pioneering XI',desc:'+4 for pre-war players · -2 for everyone else.',tier:1,era:'Pre-war',eraBonus:4,otherPenalty:-2},
  {name:'Sir Matt Busby',from:1945,to:1969,perk:'Trust in youth',desc:'+5 chemistry across your XI · +2 midfield and attack.',tier:3,chem:5,boost:{CM:2,AM:2,LM:2,RM:2,LW:2,RW:2,ST:2}},
  {name:'Tommy Docherty',from:1972,to:1977,perk:'Attack, attack',desc:'+5 wide midfield and wingers · +2 forwards · -2 centre-backs.',tier:2,boost:{RM:5,LM:5,RW:5,LW:5,ST:2},penalty:{CB:-2}},
  {name:'Ron Atkinson',from:1981,to:1986,perk:'Cup flair',desc:'+4 attacking midfield and forwards · -1 holding midfield and defence.',tier:2,boost:{AM:4,ST:4,LW:3,RW:3},penalty:{DM:-1,CB:-1,RB:-1,LB:-1}},
  {name:'Sir Alex Ferguson',from:1986,to:2013,perk:'Never say die',desc:'+3 forwards · +2 midfield · late-match attacking surge.',tier:3,chem:4,boost:{ST:3,LW:3,RW:3,AM:2,CM:2,DM:2,RM:2,LM:2},late:true},
  {name:'Louis van Gaal',from:2014,to:2016,perk:'Control first',desc:'+4 midfield and full-backs · -2 strikers and wingers.',tier:2,boost:{CM:4,DM:4,RB:3,LB:3},penalty:{ST:-2,LW:-2,RW:-2}},
  {name:'José Mourinho',from:2016,to:2018,perk:'Low block',desc:'+5 goalkeepers and defence · -2 attacking midfield and wide forwards.',tier:2,boost:{GK:5,CB:5,RB:4,LB:4,DM:3},penalty:{AM:-2,LW:-2,RW:-2}},
  {name:'Ole Gunnar Solskjaer',from:2018,to:2021,perk:'Break at pace',desc:'+5 forwards and wingers · -2 centre-backs and holding midfield · better on the counter.',tier:1,boost:{ST:5,LW:5,RW:5},penalty:{CB:-2,DM:-2},counter:true},
  {name:'Erik ten Hag',from:2022,to:2024,perk:'Cup intensity',desc:'+3 central midfield and wingers · -1 goalkeeper and centre-backs.',tier:1,boost:{CM:3,DM:3,LW:3,RW:3},penalty:{GK:-1,CB:-1}}
];
const FORMATIONS = {
  '4-4-2':[['GK',50,7],['RB',84,29],['CB',62,24],['CB',38,24],['LB',16,29],['RM',84,55],['CM',62,53],['CM',38,53],['LM',16,55],['ST',62,84],['ST',38,84]],
  '4-3-3':[['GK',50,7],['RB',84,29],['CB',62,24],['CB',38,24],['LB',16,29],['DM',50,44],['CM',71,61],['CM',29,61],['RW',84,80],['ST',50,88],['LW',16,80]],
  '4-2-3-1':[['GK',50,7],['RB',84,29],['CB',62,24],['CB',38,24],['LB',16,29],['DM',62,45],['DM',38,45],['RW',84,67],['AM',50,68],['LW',16,67],['ST',50,88]],
  '4-1-2-1-2':[['GK',50,7],['RB',84,29],['CB',62,24],['CB',38,24],['LB',16,29],['DM',50,43],['CM',72,58],['CM',28,58],['AM',50,69],['ST',65,87],['ST',35,87]],
  '3-5-2':[['GK',50,7],['CB',75,29],['CB',50,24],['CB',25,29],['RM',88,55],['CM',68,58],['DM',50,48],['CM',32,58],['LM',12,55],['ST',64,86],['ST',36,86]],
  '3-4-3':[['GK',50,7],['CB',75,29],['CB',50,24],['CB',25,29],['RM',85,53],['CM',62,53],['CM',38,53],['LM',15,53],['RW',80,82],['ST',50,88],['LW',20,82]],
  '5-3-2':[['GK',50,7],['RB',88,32],['CB',69,25],['CB',50,23],['CB',31,25],['LB',12,32],['CM',73,57],['DM',50,50],['CM',27,57],['ST',64,86],['ST',36,86]]
};
// Each formation has deliberate pitch links. Empty neighbours count as zero chemistry.
const FORMATION_LINKS = {
  '4-4-2':[[0,2],[0,3],[1,2],[2,3],[3,4],[1,5],[2,6],[3,7],[4,8],[5,6],[6,7],[7,8],[5,9],[6,9],[7,10],[8,10],[9,10]],
  '4-3-3':[[0,2],[0,3],[1,2],[2,3],[3,4],[2,5],[3,5],[1,6],[4,7],[5,6],[5,7],[6,7],[6,8],[7,10],[8,9],[9,10],[6,9],[7,9]],
  '4-2-3-1':[[0,2],[0,3],[1,2],[2,3],[3,4],[2,5],[3,6],[5,6],[1,7],[4,9],[5,7],[5,8],[6,8],[6,9],[7,8],[8,9],[7,10],[8,10],[9,10]],
  '4-1-2-1-2':[[0,2],[0,3],[1,2],[2,3],[3,4],[2,5],[3,5],[1,6],[4,7],[5,6],[5,7],[6,8],[7,8],[8,9],[8,10],[9,10],[6,9],[7,10]],
  '3-5-2':[[0,1],[0,2],[0,3],[1,2],[2,3],[1,4],[3,8],[1,6],[3,6],[4,5],[5,6],[6,7],[7,8],[5,9],[7,10],[4,9],[8,10],[9,10],[6,9],[6,10]],
  '3-4-3':[[0,1],[0,2],[0,3],[1,2],[2,3],[1,4],[3,7],[1,5],[3,6],[4,5],[5,6],[6,7],[4,8],[7,10],[5,9],[6,9],[8,9],[9,10],[5,8],[6,10]],
  '5-3-2':[[0,2],[0,3],[0,4],[1,2],[2,3],[3,4],[4,5],[1,6],[5,8],[3,7],[6,7],[7,8],[6,9],[8,10],[9,10],[7,9],[7,10]]
};
const HEROES = {
  'Duncan Edwards':'Busby Babe · +4 in midfield',
  'Bobby Charlton':'United icon · +3 in attack',
  'George Best':'The Belfast Boy · +4 out wide',
  'Denis Law':'The King · +4 up front',
  'Eric Cantona':'The King · +4 up front',
  'Bryan Robson':'Captain Marvel · +4 in midfield',
  'Cristiano Ronaldo':'Ballon d’Or · +4 in attack',
  'Ruud van Nistelrooy':'Penalty-box killer · +4 up front',
  'Wayne Rooney':'Record scorer · +3 in attack',
  'Peter Schmeichel':'The Great Dane · +4 in goal',
  'Paul Scholes':'The maestro · +3 in midfield',
  'Bruno Fernandes':'Captain · +3 in midfield',
  'David Beckham':'Set-piece specialist · +2 out wide',
  'Denis Irwin':'Mr Reliable · +2 at full-back',
  'Robin van Persie':'Title-winning finisher · +2 up front',
  'Ji-sung Park':'Big-game engine · +2 in midfield',
  'Antonio Valencia':'Two-way runner · +2 on the right',
  'Alejandro Garnacho':'Cup-final spark · +1 out wide'
};
const CURSED = {'Bébé':'Raw gamble · -3 rating, -12 links','Ángel Di María':'Disconnected · -3 rating, -28 links','Alexis Sánchez':'Unsettled · -4 rating, -22 links','Jadon Sancho':'Stop-start spell · -2 rating, -18 links'};
const CURSE_EFFECTS = {'Bébé':{rating:-3,link:-12},'Ángel Di María':{rating:-3,link:-28},'Alexis Sánchez':{rating:-4,link:-22},'Jadon Sancho':{rating:-2,link:-18}};
const DUOS = [
  {name:'Class of 92',players:['David Beckham','Paul Scholes','Ryan Giggs','Gary Neville','Nicky Butt'],bonus:2,link:14},
  {name:'Cole & Yorke',players:['Andy Cole','Dwight Yorke'],bonus:4,link:24},
  {name:'Ferdinand & Vidić',players:['Rio Ferdinand','Nemanja Vidić'],bonus:4,link:24},
  {name:'The Holy Trinity',players:['George Best','Denis Law','Bobby Charlton'],bonus:3,link:18},
  {name:'Busby Babes',players:['Duncan Edwards','Tommy Taylor','Roger Byrne','Eddie Colman'],bonus:2,link:15},
  {name:'Bruno & Mainoo',players:['Bruno Fernandes','Kobbie Mainoo'],bonus:3,link:18},
  {name:'Ronaldo & Rooney',players:['Cristiano Ronaldo','Wayne Rooney'],bonus:3,link:18},
  {name:'Scholes & Carrick',players:['Paul Scholes','Michael Carrick'],bonus:3,link:18},
  {name:'Robson & Hughes',players:['Bryan Robson','Mark Hughes'],bonus:3,link:16},
  {name:'Garnacho & Mainoo',players:['Alejandro Garnacho','Kobbie Mainoo'],bonus:2,link:16}
];
const OPPONENTS = [
  {name:'2024 FA Cup winners',strength:78,key:['Kobbie Mainoo','Bruno Fernandes'],manager:'Erik ten Hag',formation:'4-2-3-1',match:'25 May 2024 · FA Cup final v Man City',source:'https://www.mancity.com/news/mens/manchester-city-v-manchester-united-2024-fa-cup-final-report-63852241',trait:'Cup final focus',desc:'They start fast and defend a lead fiercely.',xi:['André Onana','Aaron Wan-Bissaka','Raphaël Varane','Lisandro Martínez','Diogo Dalot','Sofyan Amrabat','Kobbie Mainoo','Alejandro Garnacho','Scott McTominay','Marcus Rashford','Bruno Fernandes']},
  {name:'1977 FA Cup winners',strength:79,key:['Steve Coppell','Stuart Pearson'],manager:'Tommy Docherty',formation:'4-4-2',match:'21 May 1977 · FA Cup final v Liverpool',source:'https://www.fa-cupfinals.co.uk/1977.htm',trait:'Wide threat',desc:'Their wingers become more dangerous after half-time.',xi:['Alex Stepney','Jimmy Nicholl','Brian Greenhoff','Martin Buchan','Arthur Albiston','Steve Coppell','Sammy McIlroy','Lou Macari','Gordon Hill','Jimmy Greenhoff','Stuart Pearson']},
  {name:'1990 FA Cup winners',strength:80,key:['Bryan Robson','Mark Hughes'],manager:'Sir Alex Ferguson',formation:'4-4-2',match:'17 May 1990 · FA Cup final replay v Crystal Palace',source:'https://www.11v11.com/matches/manchester-united-v-crystal-palace-17-may-1990-216271/',trait:'Last chance',desc:'They push harder in the final 15 minutes.',xi:['Les Sealey','Mike Phelan','Gary Pallister','Steve Bruce','Lee Martin','Brian McClair','Bryan Robson','Paul Ince','Neil Webb','Mark Hughes','Danny Wallace']},
  {name:'1963 FA Cup winners',strength:81,key:['Bobby Charlton','Denis Law'],manager:'Sir Matt Busby',formation:'4-4-2',match:'25 May 1963 · FA Cup final v Leicester',source:'https://www.11v11.com/matches/manchester-united-v-leicester-city-25-may-1963-211922/',trait:'Law of the land',desc:'Their forwards are clinical when chances fall.',xi:['David Gaskell','Tony Dunne','Bill Foulkes','Maurice Setters','Noel Cantwell','Albert Quixall','Pat Crerand','Johnny Giles','Bobby Charlton','Denis Law','David Herd']},
  {name:'1993 champions',strength:82,key:['Peter Schmeichel','Eric Cantona'],manager:'Sir Alex Ferguson',formation:'4-4-2',match:'10 April 1993 · 2–1 v Sheffield Wednesday',source:'https://www.11v11.com/matches/manchester-united-v-sheffield-wednesday-10-april-1993-21187/',trait:'The breakthrough',desc:'They punish players out of position.',xi:['Peter Schmeichel','Paul Parker','Gary Pallister','Steve Bruce','Denis Irwin','Lee Sharpe','Paul Ince','Brian McClair','Ryan Giggs','Eric Cantona','Mark Hughes']},
  {name:'1957 Busby Babes',strength:83,key:['Duncan Edwards','Bobby Charlton'],manager:'Sir Matt Busby',formation:'3-5-2',match:'4 May 1957 · FA Cup final v Aston Villa',source:'https://www.fa-cupfinals.co.uk/1957.htm',trait:'Fearless youth',desc:'Their energy grows as the match goes on.',xi:['Ray Wood','Bill Foulkes','Jackie Blanchflower','Roger Byrne','Johnny Berry','Eddie Colman','Duncan Edwards','Liam Whelan','David Pegg','Tommy Taylor','Bobby Charlton']},
  {name:'2013 champions',strength:84,key:['Wayne Rooney','Robin van Persie'],manager:'Sir Alex Ferguson',formation:'4-4-2',match:'22 April 2013 · title clincher v Aston Villa',source:'https://www.skysports.com/football/man-utd-vs-a-villa/teams/283165',trait:'One last title',desc:'Their attack rises whenever they fall behind.',xi:['David de Gea','Rafael da Silva','Phil Jones','Jonny Evans','Patrice Evra','Antonio Valencia','Michael Carrick','Ryan Giggs','Shinji Kagawa','Wayne Rooney','Robin van Persie']},
  {name:'1968 European champions',strength:85,key:['George Best','Bobby Charlton'],manager:'Sir Matt Busby',formation:'4-4-2',match:'29 May 1968 · European Cup final v Benfica',source:'https://www.uefa.com/uefachampionsleague/match/62426--man-utd-vs-benfica/lineups/',trait:'European night',desc:'Low-chemistry players struggle under pressure.',xi:['Alex Stepney','Shay Brennan','Bill Foulkes','David Sadler','Tony Dunne','George Best','Nobby Stiles','Pat Crerand','John Aston Jr','Bobby Charlton','Brian Kidd']},
  {name:'2008 European champions',strength:87,key:['Cristiano Ronaldo','Wayne Rooney','Rio Ferdinand'],manager:'Sir Alex Ferguson',formation:'4-2-3-1',match:'21 May 2008 · Champions League final v Chelsea',source:'https://www.uefa.com/newsfiles/UCL/2008/301604_LU.pdf',trait:'Relentless',desc:'Their attack rises every 15 minutes without a goal.',xi:['Edwin van der Sar','Wes Brown','Rio Ferdinand','Nemanja Vidić','Patrice Evra','Michael Carrick','Paul Scholes','Owen Hargreaves','Carlos Tévez','Cristiano Ronaldo','Wayne Rooney']},
  {name:'1999 Treble winners',strength:89,key:['Peter Schmeichel','David Beckham','Dwight Yorke'],manager:'Sir Alex Ferguson',formation:'4-4-2',match:'26 May 1999 · Champions League final v Bayern',source:'https://www.uefa.com/MultimediaFiles/Download/competitions/Statistics/01/85/99/80/1859980_DOWNLOAD.pdf',trait:'Never beaten',desc:'When behind, their late pressure becomes overwhelming.',xi:['Peter Schmeichel','Gary Neville','Ronny Johnsen','Jaap Stam','Denis Irwin','Ryan Giggs','David Beckham','Nicky Butt','Jesper Blomqvist','Andy Cole','Dwight Yorke']}
];
const RUN_PERKS = [
  {id:'training',name:'Training ground',desc:'+8 chemistry for every player.',chem:8},
  {id:'connections',name:'Better together',desc:'+12 chemistry on every shared-time link.',link:12},
  {id:'confidence',name:'Winning belief',desc:'+1 rating for every player.',boost:1},
  {id:'finishing',name:'Clinical finish',desc:'+3 rating for strikers.',boost:3,positions:['ST']},
  {id:'wide',name:'Wing play',desc:'+2 rating for wide players.',boost:2,positions:['RW','LW','RM','LM']},
  {id:'engine',name:'Midfield engine',desc:'+2 rating for central midfielders.',boost:2,positions:['CM','DM','AM']},
  {id:'backline',name:'Solid back line',desc:'+2 rating for defenders.',boost:2,positions:['CB','RB','LB']},
  {id:'keeper',name:'Safe hands',desc:'+3 rating for your goalkeeper.',boost:3,positions:['GK']},
  {id:'heroes',name:'Big-game players',desc:'+2 rating for United heroes.',boost:2,heroes:true},
  {id:'versatility',name:'Flexible shape',desc:'Reduce every position penalty by 4.',fitRelief:4},
  {id:'trust',name:'Trust the manager',desc:'+8 chemistry for players who played under your manager.',managedChem:8},
  {id:'partnerships',name:'Familiar faces',desc:'+15 chemistry on partnership links.',duoLink:15}
];
const ACHIEVEMENTS = [
  ['five','Five up','Win five matches in a run.'],['ten','Run the gauntlet','Beat all ten.'],['purist','Purist','Beat all ten with one era selected.'],['twotone','Two-tone','Beat all ten with two eras.'],['trilogy','Trilogy','Beat all ten with three eras.'],['ages','Through the ages','Win five with all nine eras in the pool.'],['sepia','Sepia','Win with three pre-war players in your XI.'],['square','Square pegs','Win with three players out of position.'],['rush','Rush goalie','Win with an outfielder in goal.'],['spot','Spot on','Win a penalty shootout.'],['comeback','Never say die','Win from two goals down.'],['hat','Hat-trick hero','One of your players scores three in a match.'],['wall','The wall','Three clean sheets in one run.'],['cult','Cult hero','A player under 75 scores a winner.'],['busby','Busby way','All eleven played under your manager.'],['telepathy','Telepathy','Enter the gauntlet with 90+ chemistry.'],['given','Take what you’re given','Win a match with no draft skips.'],['made','Made it myself','Beat all ten without the wildcard.'],['sunday','Sunday league','Enter with a team rating under 65.'],['shock','Shock result','Win with a team rating under 72.'],['cursed','Cursed','Beat all ten with a cursed card.'],['blind','Blindfold','Win five matches in hardcore mode.']
];
