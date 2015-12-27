# MusicDown-Language
MDL = Music Macro Language(MML) + Markdown

---

MML의 불편한점을 개선하고 코드와 결과물이 최대한 비슷하게 보이도록 디자인되었습니다.
프로젝트 기여는 언제나 환영입니다 :)

테스트페이지 : http://lsb522.dothome.co.kr/mdl/



## Tutorial

마비노기 유저분들은 간단하게 mml2 라고 생각하시면 되겠습니다.
사실 mml작성을 편리하게 해주는게 아니고 mml 자체를 대체하는게 목표입니다만.. (어차피 편한건 시퀸서가 제일 편하기 때문에)

언어의 컨셉은 컴퓨터가 아니라 사람이 읽기 쉬운 언어입니다.
핵심 문법은 다음과 같습니다.


###1. 박자
`-` <- 요녀석이 기본박자만큼 길이를 더해줍니다.

mml : `g4a8g16a8.`

mdl : `솔---라-솔라--`

음알못이 봐도 음길이가 짐작이 가게 되었습니다.


###2. 한 음에 대한 옥타브 변경

mml : `gab<c>bb<c>b<c`

mdl : `솔라시도'시시도'시도'`

mml에서는 시랑 도랑 번갈아가면서 나오면 매우 화가납니다.
mdl에서는 도'' 도.. 등 2옥타브씩 널뛰기해도 괜찮습니다.


###3. 분리된 설정변수

mml : `abcdL16abcdT80c`

mdl :

    ''     'l:16'  't:80'
    라시도레 *라시도레 *도
이게 제일 난해한 문법인데 mdl에서는 '멜로디행'과 '이벤트행'이 따로 있습니다.
'_' 안에 변수가 들어가며 멜로디행의 첫 음을 포함한 *이 있는 곳을 가리키게 됩니다.


###4. 화음

mml :

    melody: c8d16e4f8g16a8
    chord: r8r16r4r8r16c8
mdl :

    | 도-레미---파-솔라 |
      ,  , ,   ,  ,도
위에서는 마디를 생략했는데 사실 마디가 있는 행은 '멜로디행' 마디가 없는 행은 '화음행'이 됩니다. mml처럼 새로운 트랙을 만들어 원하는 타이밍에 소리가 나도록 쉼표를 적는 고생을 하지 않아도 됩니다.

아 물론 트랙을 새로 만들고 싶으면 아래와 같이 하시면 됩니다.

    'piano'
    | 도레미파 |
    'bass'
    | 도- 도- |


###5. 잇단음표
mdl : `(도레미)파- (솔라시도레)`

mdl에서는 ( )로 감싸면 알아서 잇단음표를 만들어줍니다.
현재 3,5,7연음이 가능합니다.
(mml로 변환한 뒤 마비노기 인게임상에서는 오류가 있을 가능성이 있습니다)
