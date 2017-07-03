import { create } from 'rung-sdk';
import { OneOf, Double } from 'rung-sdk/dist/types';
import Bluebird from 'bluebird';
import agent from 'superagent';
import promisifyAgent from 'superagent-promise';
import { path, lt, gt, pipe, cond, equals, contains, __, T, concat } from 'ramda';
import { JSDOM } from 'jsdom';

const request = promisifyAgent(agent, Bluebird);

function render(card_titulo, card_subtitulo, card_preco) {

    return (
		<div style="width:165px; height:125px; box-sizing: border-box; padding: 1px; overflow: hidden; position: absolute; margin: -12px 0 0 -10px; ">

			<div style="width:100%; height:20px; background-color: rgba(255,255,255,0.5); position: relative; z-index:1; ">
				<div style="background: url('http://www.pbanimado.com.br/rung/icon-amendoim.png') no-repeat center center; background-size: 100%; width:50px; height: 50px; position: absolute; z-index:2; margin: -10px 0 0 54px; border: 3px solid #FFF; -webkit-border-radius: 50%; -moz-border-radius: 50%; border-radius: 50%;"></div>
			</div>

			<div style="font-size:11px; width:96%; line-height: 1.3; text-align: center; padding: 30px 2% 0; ">
				<p style="margin:0; padding: 0; ">{card_titulo}</p>
				<p style="margin:0; padding: 0; ">{card_subtitulo}</p>
				<p style="margin:0; padding: 0; ">Preço: <strong style="text-decoration: underline; ">R$ {card_preco}</strong></p>
			</div>
		</div>
	);


}

function nodeListToArray(dom) {
    return Array.prototype.slice.call(dom, 0);
}

function returnSelector(row, cell) {
	const selector = `#content .middle .tables .cotacao:nth-child(1) .table-content table tbody > tr:nth-child(${row}) > td:nth-child(${cell})`;
	return selector;
}

function main(context, done) {

	const { fonte, condicao, valor } = context.params;

	// variáveis padrão
	var fonte_link = 'https://www.noticiasagricolas.com.br/cotacoes/amendoim/amendoim-ceasas';

	var fonte_data = '#content .middle .tables .cotacao:nth-child(1) .info .fechamento';
	var fonte_titulo 	= "";
	var fonte_subtitulo	= "";
	var fonte_preco 	= "";
	var fonte_variacao 	= "";

	// definindo os valores padrão
	switch (fonte) {

    	case 'Ceasa Campinas-SP - com casca / kg':
			fonte_titulo 	= returnSelector('1', '1');
			fonte_subtitulo	= returnSelector('2', '1');
			fonte_preco 	= returnSelector('2', '2');
			fonte_variacao 	= returnSelector('2', '3');
    		break;

    	case 'Ceasa Campinas-SP - sem casca / kg':
			fonte_titulo 	= returnSelector('1', '1');
			fonte_subtitulo	= returnSelector('3', '1');
			fonte_preco 	= returnSelector('3', '2');
			fonte_variacao 	= returnSelector('3', '3');
    		break;

    	case 'Ceasa Belo Horizonte-MG - com casca / saca 25 kg':
			fonte_titulo 	= returnSelector('4', '1');
			fonte_subtitulo	= returnSelector('5', '1');
			fonte_preco 	= returnSelector('5', '2');
			fonte_variacao 	= returnSelector('5', '3');
    		break;

    	case 'Ceasa Belo Horizonte-MG - sem casca / saca 50 kg':
			fonte_titulo 	= returnSelector('4', '1');
			fonte_subtitulo	= returnSelector('6', '1');
			fonte_preco 	= returnSelector('6', '2');
			fonte_variacao 	= returnSelector('6', '3');
    		break;

    	case 'Ceagesp-SP - com casca / saca 25 kg':
			fonte_titulo 	= returnSelector('7', '1');
			fonte_subtitulo	= returnSelector('8', '1');
			fonte_preco 	= returnSelector('8', '2');
			fonte_variacao 	= returnSelector('8', '3');
    		break;

    	case 'Ceagesp-SP - sem casca / saca 25 kg':
			fonte_titulo 	= returnSelector('7', '1');
			fonte_subtitulo	= returnSelector('9', '1');
			fonte_preco 	= returnSelector('9', '2');
			fonte_variacao 	= returnSelector('9', '3');
    		break;

	}

	// Obter todo o HTML do site em modo texto
	return request.get(fonte_link).then(({ text }) => {

		// Virtualizar o DOM do texto
		const { window } = new JSDOM(text);

		// Converter os dados da tabela para uma lista
		const retorno_data 		= window.document.querySelector(fonte_data).innerHTML;
		const retorno_titulo 	= window.document.querySelector(fonte_titulo).innerHTML;
		const retorno_subtitulo	= window.document.querySelector(fonte_subtitulo).innerHTML;
		const retorno_preco 	= window.document.querySelector(fonte_preco).innerHTML;
		const retorno_variacao 	= window.document.querySelector(fonte_variacao).innerHTML;

		// arrumando o valor que vem do HTML
		var valorHTML = parseFloat(retorno_preco.replace(',', '.'));

		// arrumando o valor que é digitado
		var valorFormatado = valor.toFixed(2);

		// formatando comentario
		var comentario = "<p style='font-weight: bold; font-size: 18px; '>Amendoim - Ceasas</p><hr><p style='font-size: 16px; font-weight: bold; '>" + retorno_data + "</p><p style='font-size: 16px; font-weight: bold; '>" + retorno_titulo + "</p><p style='font-size: 16px; '><span style='font-weight: bold; '>Tipo</span>: " + retorno_subtitulo + "</p><p style='font-size: 16px; '><span style='font-weight: bold; '>Preço</span>: R$ " + retorno_preco + "</p><p style='font-size: 16px; '><span style='font-weight: bold; '>Variação</span>: " + retorno_variacao + "%</p><br><p style='font-size: 16px; '>Fonte: Portal Notícias Agrícolas</p><a href='" + fonte_link + "' target='_blank' style='font-size: 14px; font-style: italic; '>http://www.noticiasagricolas.com.br</a>";

		console.log(comentario);

		var nome = retorno_titulo + " - " + retorno_subtitulo;

		// verificação de maior OU menor
		if ((condicao == 'maior' && valorHTML > valor) || (condicao == 'menor' && valorHTML < valor)) {

			done({
				alerts: {
					[`amendoim${nome}`] : {
						title: nome,
						content: render(retorno_titulo, retorno_subtitulo, retorno_preco),
						comment: comentario
					}
				}
			});

		} else {

			done({ alerts: {} });

		}
	})
	.catch(() => done({ alerts: {} }));

}

const lista_fontes = [
	'Ceasa Campinas-SP - com casca / kg',
	'Ceasa Campinas-SP - sem casca / kg',
	'Ceasa Belo Horizonte-MG - com casca / saca 25 kg',
	'Ceasa Belo Horizonte-MG - sem casca / saca 50 kg',
	'Ceagesp-SP - com casca / saca 25 kg',
	'Ceagesp-SP - sem casca / saca 25 kg'
];

const params = {
    fonte: {
        description: _('Informe a fonte que você deseja ser informado: '),
        type: OneOf(lista_fontes),
		required: true
    },
	condicao: {
		description: _('Informe a condição (maior, menor): '),
		type: OneOf(['maior', 'menor']),
		default: 'maior'
	},
	valor: {
		description: _('Informe o valor em reais para verificação: '),
		type: Double,
		required: true
	}
};

export default create(main, {
    params,
    primaryKey: true,
    title: _("Cotação Amendoim"),
    description: _("Acompanhe a cotação do amendoim em diversas praças."),
	preview: render('Ceasa Campinas-SP', 'com casca / kg', '4,50')
});