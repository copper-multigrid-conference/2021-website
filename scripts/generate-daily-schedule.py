"""Generate a daily schedule
"""
import re
import subprocess

import bs4 as bs
import requests


def tex_escape(text):
    """
        :param text: a plain text message
        :return: the message escaped to appear correctly in LaTeX
    """
    conv = {
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\^{}',
        '\\': r'\textbackslash{}',
        '<': r'\textless{}',
        '>': r'\textgreater{}',
    }
    regex = re.compile('|'.join(re.escape(str(key)) for key in sorted(conv.keys(), key=lambda item: - len(item))))
    return regex.sub(lambda match: conv[match.group()], text)


latexdoc0 = r'''\documentclass{article}
\usepackage[landscape,margin=1in]{geometry}
\usepackage{booktabs}
\usepackage{longtable}
\usepackage[defaultfam,light,tabular,lining]{montserrat}
\usepackage[table]{xcolor}

% basic column sizes
\newlength\qs
\setlength\qs{\dimexpr .08\textwidth -2\tabcolsep}
\newlength\ql
\setlength\ql{\dimexpr .34\textwidth -2\tabcolsep}

% multicolumns
\newlength\qsessfull
\setlength\qsessfull{\dimexpr .92\textwidth -2\tabcolsep}
\newlength\qsesshalf
\setlength\qsesshalf{\dimexpr .42\textwidth -2\tabcolsep}
\newlength\qtitlefull
\setlength\qtitlefull{\dimexpr .84\textwidth -2\tabcolsep}

\newcommand{\sessfull}[1]{\multicolumn{5}{p{\qsessfull}}{#1}}
\newcommand{\sesshalf}[1]{\multicolumn{2}{p{\qsesshalf}}{#1}}
\newcommand{\titlefull}[1]{\multicolumn{4}{p{\qtitlefull}}{#1}}

\begin{document}
'''

latexdoc1 = r'''\end{document}
'''


def scrub_data(soup):
    """
    scroup data
    """
    raw = False
    sessiondata = []

    sessions = soup.findAll("div", {"class": "session"})
    for session in sessions:
        session_time = session.findAll('span', {"class": "interval"})[0].text

        session_name = session.findAll('span', {"class": "title"})[0].text
        part = 'full'
        m = re.match("Session\s+[0-9]+([A,B]):", session_name)
        if m:
            part = m.groups(0)[0]

        if raw:
            print("{}: {}".format(session_time, session_name))
        talks = session.findAll('table')

        talkdata = []
        if talks:
            for talk in talks[0].findAll('tr'):
                talk_time = talk.findAll('td', {"class": "time"})[0].text
                authors = talk.findAll('div', {"class": "authors"})[0]
                talk_authors = [t.text for t in authors.findAll('a', {"class": "person"})]
                speakers = talk.findAll('div', {"class": "speaker"})
                if speakers:
                    talk_speaker = speakers[0].findAll('a', {"class": "person"})[0].text
                else:
                    talk_speaker = talk_authors[0]
                talk_title = talk.findAll('div', {"class": "title"})[0].text
                if raw:
                    auths = [f'**{a}**' if a == talk_speaker else a for a in talk_authors]
                    print('          {}: {}'.format(talk_time, ', '.join(auths)))
                    print('                 {}'.format(talk_title))
                talkdata.append([talk_time, talk_authors, talk_speaker, talk_title])

        sessiondata.append([session_time, session_name, part, talkdata])
    return sessiondata


def fsess(mystr):
    """session formatting"""
    return f'\\textbf{{{mystr}}}'


def ftitle(mystr):
    """title formatting"""
    return f'\\textit{{{mystr}}}'


def fspeaker(mystr):
    """speaker formatting"""
    return f'{{\\color{{black!70}}\\fontseries{{mb}}\\selectfont {mystr}}}'


def froom(mystr):
    """room formatting"""
    return f'{{\\color{{black!70}}\\fontseries{{mb}}\\selectfont {mystr}}}'


def fauth(mystr):
    """author formatting"""
    return f'{{\\tiny \\color{{black!70}}\\selectfont {mystr}}}'


def fstime(mystr):
    """time formatting"""
    return f'\\textbf{{{mystr}}}'


def generate_tex(sessiondata):
    latexmain = r'\noindent\begin{longtable}{p{\qs}p{\qs}p{\ql}p{\qs}p{\qs}p{\ql}}' + '\n'
    midrule0 = '\\arrayrulecolor{black!20}\\midrule'

    s = 0
    while s < len(sessiondata):
        session_time, session_name, part, talkdata = sessiondata[s]

        if part == 'full':
            session_time = fstime(session_time)
            session_name = fsess(session_name)
            if any(s in session_name for s in ['Breakfast', 'Coffee', 'Lunch', 'Banquet']):
                room_name = ''
            else:
                room_name = froom("Bighorn C")
            latexmain += f'{session_time} & \\sessfull{{{session_name} \\quad {room_name}}} \\\\{midrule0}\n'
            if talkdata:
                i = 0
                for talk_time, talk_authors, talk_speaker, talk_title in talkdata:
                    other_authors = ', '.join([a for a in talk_authors if a != talk_speaker])
                    other_authors = fauth(other_authors)
                    talk_speaker = fspeaker(talk_speaker)
                    auths = f'{talk_speaker}'
                    i += 1
                    if i == len(talkdata):
                        midrule = midrule0
                    else:
                        midrule = ''
                    talk_title = ftitle(tex_escape(talk_title))
                    latexmain += f'& {talk_time} & \\titlefull{{{talk_title}\\newline {auths} {other_authors}}} \\\\{midrule}\n'

        if part == 'A':
            session_timeA, session_nameA, partA, talkdataA = session_time, session_name, part, talkdata
            session_timeB, session_nameB, partB, talkdataB = sessiondata[s + 1]

            session_nameA = session_nameA.replace('&', '\\&')
            session_nameB = session_nameB.replace('&', '\\&')
            if partB != 'B':
                raise 'Problem with part B!!!'

            session_timeA = fstime(session_timeA)
            session_timeB = fstime(session_timeB)
            session_nameA = fsess(session_nameA)
            session_nameB = fsess(session_nameB)
            room_nameA = froom("Bighorn C")
            room_nameB = froom("Bighorn B")
            latexmain += f'{session_timeA} & \\sesshalf{{{session_nameA} \\quad {room_nameA}}} & {session_timeB} & \\sesshalf{{{session_nameB} \\quad {room_nameB}}} \\\\{midrule0}\n'

            alltimes = [t[0] for t in talkdataA] + [t[0] for t in talkdataB]
            alltimes = list(set(alltimes))
            alltimes.sort()

            for time in alltimes:
                for talk_timeA, talk_authorsA, talk_speakerA, talk_titleA in talkdataA:
                    if time == talk_timeA:
                        break
                    else:
                        talk_authorsA = ''
                        talk_speakerA = ''
                        talk_titleA = '---'
                for talk_timeB, talk_authorsB, talk_speakerB, talk_titleB in talkdataB:
                    if time == talk_timeB:
                        break
                    else:
                        talk_authorsB = ''
                        talk_speakerB = ''
                        talk_titleB = '---'

                # authsA = ', '.join([f'\\textbf{{{a}}}' if a == talk_speakerA else a for a in talk_authorsA])
                # authsB = ', '.join([f'\\textbf{{{a}}}' if a == talk_speakerB else a for a in talk_authorsB])
                other_authorsA = ', '.join([a for a in talk_authorsA if a != talk_speakerA])
                other_authorsB = ', '.join([a for a in talk_authorsB if a != talk_speakerB])
                other_authorsA = fauth(other_authorsA)
                other_authorsB = fauth(other_authorsB)
                talk_speakerA = fspeaker(talk_speakerA)
                talk_speakerB = fspeaker(talk_speakerB)
                authsA = f'{talk_speakerA}'
                authsB = f'{talk_speakerB}'
                if time == alltimes[-1]:
                    midrule = midrule0
                else:
                    midrule = ''
                talk_titleA = ftitle(tex_escape(talk_titleA))
                talk_titleB = ftitle(tex_escape(talk_titleB))
                latexmain += f'& {time} & {talk_titleA}\\newline {authsA} {other_authorsA}  & & {time} & {talk_titleB}\\newline {authsB}  {other_authorsB}\\\\{midrule}\n'

            latexmain += '\\pagebreak\n'
        s += 1

    latexmain += r'\end{longtable}'
    return latexmain


data = {'Monday 3/25': 'https://easychair.org/smart-program/CM2019/2019-03-25.html',
        'Tuesday 3/26': 'https://easychair.org/smart-program/CM2019/2019-03-26.html',
        'Wednesday 3/27': 'https://easychair.org/smart-program/CM2019/2019-03-27.html',
        'Thursday 3/28': 'https://easychair.org/smart-program/CM2019/2019-03-28.html'}

for d in data:
    print(f'Retreiving {d}')
    url = requests.get(data[d]).text
    soup = bs.BeautifulSoup(url, 'lxml')

    print(f'-Scrubbing {d}')
    sessiondata = scrub_data(soup)

    print(f'-Generating {d}')
    latexmain = generate_tex(sessiondata)

    title = f'{{\\centering\\LARGE\\textbf{{ {d} }}}}\\bigskip\\bigskip\n\n'
    filename = d.replace(' ', '-').replace('/', '-') + '.tex'
    print(f'-Building {filename}')
    with open(filename, "w") as texfile:
        print(latexdoc0 + title + latexmain + latexdoc1, file=texfile)
    subprocess.check_call(['latexrun', filename])

    if 0:
        for session_time, session_name, part, talkdata in sessiondata:
            for talk_time, talk_authors, talk_speaker, talk_title in talkdata:
                print(talk_speaker)
