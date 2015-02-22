
var MBTC = 1/100000

$(function(){

    $('.match').click(function(e){
        var target = $(this)
        var data = target.data()
        var match = target.text()
        $('#myModal').one('show.bs.modal', function () {
            //debugger
            //$.each(['bet_1', 'bet_2', 'bet_x'], function(i, bet){
                //$('#myModal .'+bet).data('addr', data[bet])
            //})

            //var bet1 = $('.bet_1')
            //bet1.attr('class').split(/\s/).filter(function(x){ return x.match(/^logo_/) }).map(function(x) {
                //bet1.removeClass(x)
            //})
            //bet1.addClass('logo_'+data.host)

            //var bet2 = $('.bet_2')
            //bet2.attr('class').split(/\s/).filter(function(x){ return x.match(/^logo_/) }).map(function(x) {
                //bet2.removeClass(x)
            //})
            //bet2.addClass('logo_'+data.guest)

            //var bet_x = $('.bet_x')
            //bet_x.html('<div class="tie logo_'+ data.host +'" /><h3>Remis</h3><div class="tie logo_'+ data.guest +'" />')

            var keys = (['bet_1','bet_2','bet_x']).map(function(key){ return data[key] })
            var bets = ['1', 'X', '2']

            $.getJSON('https://blockchain.info/multiaddr?active='+keys.join('|')+'&cors=true', function(json){
                var tbody = $('#bets').html('')
                var final_balance = json.wallet.final_balance
                var pool = []
                $('.pool').text(final_balance*MBTC)

                $.each(json.txs, function(){
                    var to = this.out[0].addr
                    pool[to] = pool[to] ? pool[to]+this.result : this.result
                })

                $.each(['bet_1', 'bet_2', 'bet_x'], function(i, bet){
                    var potential_bet = 500000
                    var to = $('#myModal .'+bet).data('addr')
                    var pl = (pool[to] || 0)+potential_bet
                    var x = Math.round((final_balance+potential_bet)/(pl/potential_bet)/potential_bet*100)/100
                    var button = $('#myModal .'+bet)
                    button.attr('title', 'Aktualny kurs dla stawki '+ potential_bet*MBTC +'mBTC to '+ x +' (może ulec zmianie).')
                    button.tooltip()
                })

                $.each(json.txs, function(){
                    var from = this.inputs[0].prev_out.addr
                    var to = this.out[0].addr
                    var row = [
                        moment(new Date(this.time*1000)).fromNow(), // time
                        from.substr(0,8),                           // from
                        bets[keys.indexOf(to)],                     // typ
                        Math.round(this.result*MBTC) +' mBTC',      // mbtc
                        Math.round(final_balance/(pool[to]/this.result)/this.result*100)/100 // kurs
                    ]
                    var tr = $('<tr />')
                    var tx = this.hash
                    $.each(row, function(key) {
                        var td = $('<td />')

                        if(!key) { // time
                            td.html($('<a href="https://blockchain.info/tx/'+tx+'" target="_blank" />').text(this))
                        } else {
                            td.text(this)
                        }
                        tr.append(td)
                    })
                    tbody.append(tr)
                })
            })
        })
    })

    $('.result').click(function(e){
        var addr = $(this).data('addr')
        $('#myModal').one('hidden.bs.modal', function () {

            $('#myModal2').one('shown.bs.modal', function () {
                $('#input_container input').focus().select()
                $('#input_container button').zclip({
                    path: '/js/vendor/ZeroClipboard.swf',
                    copy: $('#input_container input').val(),
                    afterCopy: function(){}
                })
            })
            $('#myModal2').one('hidden.bs.modal', function () {
                socket.close()
                $('#new_bet').hide()
                $('.zclip').remove()
            })
            $('#myModal2').modal({})
        })

        $('#myModal').modal('hide')
    })
})
;
