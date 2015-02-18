// - DayList
//  - Day
//   - MatchList
//    - Match

var DayList = React.createClass({
  render: function() {
    var dayNodes = this.props.data.map(function(day) {
      return (
        <Day data={day} />
      )
    })
    return (
      <div>
        {dayNodes}
      </div>
    )
  }
})

var Day = React.createClass({
  render: function() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <h3 className="panel-title">{ this.props.data[0] }</h3>
        </div>
        <MatchList data={ this.props.data[1] } />
      </div>
    )
  }
})

var MatchList = React.createClass({
  render: function() {
    var matchNodes = this.props.data.map(function(match) {
      return (
        <Match {...match} />
      )
    })
    return (
      <div className="panel-body">
        <div className="row">
          {matchNodes}
        </div>
      </div>
    )
  }
})

var Match = React.createClass({
  openModal: function() {
    React.render(
      <Modal {...this.props} />,
      document.getElementById('modal')
    )
  },
  render: function() {
    var hostStyle = { backgroundImage: 'url(/img/logos/'+this.props.host_h+'.png)' }
    var guestStyle = { backgroundImage: 'url(/img/logos/'+this.props.guest_h+'.png)' }
    return (
      <div className="match col-xs-12 col-sm-6 col-md-4" onClick={this.openModal}>
        <div href="#" className="thumbnail">
          <img data-src="holder.js/100x180" />
          <div className="caption">
            <div className="match_logo" style={hostStyle} ></div>
            <h3>{this.props.host} vs. {this.props.guest}</h3>
            <div className="match_logo" style={guestStyle} ></div>
          </div>
        </div>
      </div>
    )
  }
})

var Modal = React.createClass({
  getInitialState: function() {
    return {
      bets: [],
      pool: '0 bitów'
    }
  },

  componentDidMount: function() {
    var el = this.getDOMNode()
    $(el).modal({})
         .one('hidden.bs.modal', this.onHide)

    var that = this
    var keys = [this.props.bet_1, this.props.bet_X, this.props.bet_2]

    $.getJSON('https://blockchain.info/multiaddr?active='+keys.join('|')+'&cors=true', function(json){
      console.log(json)

      //var tbody = $('#bets').html('')
      var final_balance = json.wallet.final_balance/100
      that.setState({pool: final_balance+' bitów'})

      var MBTC = 1
      var pool = []

      // Zlicz pulę typów na każdy wynik
      $.each(json.txs, function(){
        var to = this.out[0].addr
        pool[to] = pool[to] ? pool[to]+this.result : this.result
      })

      var bets = []

      // Wyświetl wszystkie typy
      $.each(json.txs, function() {
        var from = this.inputs[0].prev_out.addr
        var to = this.out[0].addr
        bets.push({
          hash   : this.hash,
          time   : moment(new Date(this.time*1000)).fromNow(), // time
          from   : from.substr(0,8),                           // from
          type   : ['1','X','2'][keys.indexOf(to)],            // typ
          amount : Math.round(this.result)/100 +' bitów',      // btc
          roi    : Math.round(final_balance/(pool[to]/this.result)/this.result*100)/100 // kurs
        })
      })

      that.setState({bets: bets})
    })
  },

  onHide: function() {
    React.unmountComponentAtNode(document.getElementById('modal'))
  },

  render: function() {
    return (
      <div className="modal fade" id="myModal" tabindex="-1" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal">&times;</button>
              <h4 className="modal-title" id="myModalLabel">
                Wytypuj wynik (krok 2/3)
              </h4>
            </div>
            <div className="modal-body text-justify">
              <div className="row">
                <ResultBox hash={ this.props.host_h } onClick={ this.openModal.bind(this, this.props.bet_1) }>
                  <h3> Zwycięstwo gospodarzy </h3>
                </ResultBox>
                <ResultBox onClick={ this.openModal.bind(this, this.props.bet_X) } >
                  <div className="tie" style={{backgroundImage: 'url(/img/logos/'+this.props.host_h+'.png)'}} />
                  <h3> Remis </h3>
                  <div className="tie" style={{backgroundImage: 'url(/img/logos/'+this.props.guest_h+'.png)'}} />
                </ResultBox>
                <ResultBox hash={ this.props.guest_h } onClick={ this.openModal.bind(this, this.props.bet_2) }>
                  <h3> Zwycięstwo gości </h3>
                </ResultBox>
              </div>
              <h3>Ile jest do wygrania?</h3>
              <p>
                Aktualnie pula nagród za mecz <span id="match">{ this.props.host } vs. { this.props.guest }</span> wynosi <strong>{ this.state.pool }</strong>. Zostanie ona podzielona pomiędzy tych graczy, którzy poprawnie wytypują wynik meczu, proporcjonalnie do wartości ich zakładu. Na przykład: jeżeli pula nagród wyniesie 100 mBTC, a 50 mBTC z tej puli zostało postawionych na zwycięstwo gospodarzy, to w przypadku zwycięstwa gospodarzy, wypłata wyniesie dwukrotność wpłaty.
              </p>
              <h3>Dotychczasowe typy</h3>
              <p>
                Satohinho.pl nie operuje jak żaden z tradycyjnych bukmacherów jakich znasz, gdyż nie podejmuje żadnego ryzyka finansowego - stawką zakładu jest zawsze dokładnie tyle, ile inni gracze zdecydowali się postawić. Oto bieżąca lista wpłat na wybrany mecz (może zmieniać się w czasie):
              </p>
              <BetTable bets={ this.state.bets } />
              <p>
                * - Kurs końcowy może być inny.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  openModal: function(addr) {
    var el = this.getDOMNode()
    $(el).modal('hide')

    React.render(
      <Modal2 addr={ addr } />,
      document.getElementById('modal2')
    )
  }
})

var ResultBox = React.createClass({
  render: function() {
    return (
      <div className="result thumbnail col-xs-12 col-sm-4" data-toggle="tooltip" data-placement="bottom" style={{backgroundImage: 'url(/img/logos/'+this.props.hash+'.png)'}} onClick={ this.props.onClick } >
        {this.props.children}
      </div>
    )
  }
})

var BetTable = React.createClass({
  render: function() {
    var betRows = this.props.bets.map(function(bet) {
      return (
        <BetRow {...bet} />
      )
    })
    return (
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>Czas</th>
            <th>Nadawca</th>
            <th>Typ</th>
            <th>Kwota</th>
            <th>Kurs*</th>
          </tr>
        </thead>
        <tbody>
          { betRows }
        </tbody>
      </table>
    )
  }
})

var BetRow = React.createClass({
  render: function() {
    return (
      <tr>
        <td>
          <a href={"https://blockchain.info/tx/"+this.props.hash } target="_blank">
            { this.props.time }
          </a>
        </td>
        <td>
          { this.props.from }
        </td>
        <td>
          { this.props.type }
        </td>
        <td>
          { this.props.amount }
        </td>
        <td>
          { this.props.roi }
        </td>
      </tr>
    )
  }
})

var Modal2 = React.createClass({
  componentDidMount: function() {
    var el = this.getDOMNode()
    $(el).modal({})
         .one('hidden.bs.modal', this.onHide)
  },

  onHide: function() {
    React.unmountComponentAtNode(document.getElementById('modal2'))
  },

  render: function() {
    var addr = this.props.addr
    return (
      <div className="modal fade" id="myModal2" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal" aria-hidden="true">&times;</button>
              <h4 className="modal-title" id="myModalLabel">
                Wpłać dowolną kwotę bitcoinów (krok 3/3)
              </h4>
            </div>
            <div className="modal-body text-justify">
              <div id="new_bet" className="alert alert-warning text-center" style={{ display: 'none' }}>
                Nowa wpłata! <a href="#" id="new_bet_tx" className="alert-link" target="_blank"><span id="new_bet_value"></span> mBTC z adresu <span id="new_bet_addr"></span></a>.
              </div>
              <h3>
                Gratulacje!
              </h3>
              <span id="qr_container" className="pull-right" style={{ marginLeft: 20 }}>
                <a href={"bitcoin:"+ addr +"?amount=0.005"}>
                  <img src={"/img/qr/"+ addr +".png"} style={{ width: 210, height: 210 }} className="img-thumbnail" />
                </a>
              </span>
              <p>
                Jesteś już tylko o krok od wzięcia udziału w zakładzie. Bez rejestracji i bez podawania numeru karty kredytowej! Wystarczy, że prześlesz dowolną kwotę powyżej 5 mBTC na adres:
              </p>
              <p id="input_container" className="text-center"><input value={ addr } /><button type="button" className="btn btn-link">kopiuj</button></p>
              <p>
                Wysyłając bitcoiny upewnij się że kontrolujesz adres nadawczy (innymi słowy nie korzystasz z portwela internetowego typu Coinbase. Blockchain.info jest w porządku), gdyż w przypadku wygranej należna kwota jest wysyłana na ten sam adres z którego zakład został złożony.
              </p>
              <h3>
                Czym jest Bitcoin?
              </h3>
              <p>
                Bitcoin to cyfrowa waluta wszechstronnego zastosowania o minimalnych prowizjach i z błyskawicznym czasem transakcji. Dowiedz się więcej o tym jak działa i gdzie ją zakupić na stronie: <a href="https://bitcoin.org/pl/" target="_blank">bitcoin.org</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
})

React.render(
  <DayList data={ data } />,
  document.getElementById('content')
)
