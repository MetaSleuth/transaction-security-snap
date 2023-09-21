import {
  OnRpcRequestHandler,
  OnTransactionHandler,
  OnTransactionResponse
} from '@metamask/snap-types';
import { copyable, divider, heading, panel, text } from '@metamask/snaps-ui';

/**
 * Handle incoming Transaction requests.
 *
 * @param args - The request handler args as object.
 * @param args.transaction - The  transaction object of the request, from metamask.
 * @param args.chainId - The chainId of the request.
 * @returns insights if the request succeeded.
 * @throws If the `simulationTx` call failed.
 */
export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
}) => {
  try {
    console.log(transaction, chainId)
    const chain_ID = chainId.includes(':') ? roughScale(chainId.split(':')[1], 16) : roughScale(chainId, 16);
    if (chain_ID != 1 && chain_ID != 56) {
      const insights = { 'Mopsus Warning': ' Mopsus does not support this chain yet.' }
      return { insights }
    } else {
      const retObj = await simulationTx(transaction, chainId)
      // console.log(retObj)
      const response = await DashBoard(retObj)
      return response;
    }
  } catch (e) {
    console.log(e)
    throw e
  }
};


export interface Assets {
  token: string
  amount: number
  asvalue: number
  decimals: number
}

export interface Bundle {
  in: Assets[]
  out: Assets[]
  total: number
}

export interface Sec {
  reciver: string[]
  token: string[]
  approve: string[]
}

export interface Ret {
  code: number
  bundle: Bundle
  security: Sec
  msg?: string
}

const roughScale = (x: string, base: number) => {
  const parsed = parseInt(x, base);
  if (isNaN(parsed)) { return 0; }
  return parsed;
}

/**
 * Transaction Security Check API requests.
 *
 * @param args - The request handler args as object.
 * @param args.transaction - The  transaction object of the request, from metamask.
 * @param args.chainId - The chainId of the request.
 * @returns Retuen Json Object if the request succeeded.
 * @throws If the CORS HTTPs request call failed.
 */
export const simulationTx = async (transaction: any, chainId: string) => {
  const TX_API_ENDPOINT =
    'https://flask.blocksec.com/TxCheck';
  // POST body
  const body = {
    richMan: true,
    chainID: chainId.includes(':') ? roughScale(chainId.split(':')[1], 16) : roughScale(chainId, 16),
    bundle: [
      {
        sender: transaction.from.toLowerCase(),
        receiver: transaction.to.toLowerCase(),
        value: roughScale(transaction.value, 16).toString(),
        input: transaction.data ?
          transaction.data.toLowerCase() : "0x",
        gasLimit: transaction.gas ?
          roughScale(transaction.gas, 16) : 28500000,
        gasPrice: transaction.gasPrice ?
          roughScale(transaction.gasPrice, 16).toString() : "",
        maxFeePerGas: transaction.maxFeePerGas ?
          roughScale(transaction.maxFeePerGas, 16).toString() : "",
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ?
          roughScale(transaction.maxPriorityFeePerGas, 16).toString() : "",
      },
    ],
  };

  console.log(`metamsk data${JSON.stringify(transaction)}`)
  console.log(`raw data${JSON.stringify(body)}`);

  // Only allow Content-Type, X-CSRF-Token, Authorization, AccessToken, Token in MetaMask Flask
  const res = await fetch(TX_API_ENDPOINT, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    mode: 'cors',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error('Bad response from server');
  }
  const json = await res.json();
  console.log(`return data${JSON.stringify(json)}`);
  const retObj: Ret = JSON.parse(JSON.stringify(json));
  return retObj;
};

export type DashBoardHandler = (retObj: Ret) => Promise<OnTransactionResponse>;


const splitThousandSeparator = (num: number, dec: number, unit: string) => {
  if (Math.abs(num) < 1e-8) {
    return unit + "0"
  }
  let head: string = "";
  if (num < 0) {
    num *= -1;
    head = "-";
  } else {
    head = "+";
  }
  let DIGIT_PATTERN = /(^|\s)\d+(?=\.?\d*($|\s))/g;
  let MILI_PATTERN = /(?=(?!\b)(\d{3})+\.?\b)/g;
  let str: string = num.toFixed(dec).replace(DIGIT_PATTERN, (m) => m.replace(MILI_PATTERN, ','));
  return " " + head + " " + unit + str
}

//MetaMask flask only accept OnTransactionResponse{[key:string]:string} input, We  
//try our best to imporve the dashboard using '' to replace '\r'.
/**
 * Transaction Security Check API requests.
 *
 * @param args - The request handler args as object.
 * @param args.retObj - The Json Object from API.
 * @returns Retuen OnTransactionResponse Object.
 */
const DashBoard: DashBoardHandler = async (
  retObj,
) => {
  let inValue = 0

  // return {
  //   content: panel([
  //     heading('Transaction insights snap'),
  //     text(
  //       `1`,
  //     ),
  //   ]),
  // };
  //Simulation Failed/Revert
  if (retObj.code != 0) {
    const insights = {
      content: panel([
        heading('Mopsus Warning'),
        text(
          `Mopsus shows the transaction will fail.`,
        ),
      ]),
    };
    console.log(`Error at ${retObj.msg}`)
    return  insights 
  }
  // const response = { insights: {} } as OnTransactionResponse
  const dialog : any[] = [];
  let map: string = ''

  if (retObj.bundle.in == null && retObj.bundle.out == null && retObj.bundle.total == 0) {
    // // response.insights[map] = 'No Balance Change'
    dialog.push(heading(map))
    dialog.push(text("No Balance Change"))
    map += ' '
  } else {
    // // response.insights[`Balance Changes of Sender: ${splitThousandSeparator(retObj.bundle.total, 3, "$")}`] = ``
    dialog.push(heading(`Sender Balance Changes: ${splitThousandSeparator(retObj.bundle.total, 3, "$")}`))
  }

  dialog.push(heading(map))
  dialog.push(heading(map))

  if (retObj.bundle.out != null) {
    for (let i of retObj.bundle.out) {
      if (i.asvalue != 0) {
        const note = `${splitThousandSeparator(i.amount / Math.pow(10, i.decimals), 10, "")} ${i.token} (${splitThousandSeparator(i.asvalue, 2, "$")})`
        const notes = note.toString()
        console.log(note.toString())
        // response.insights[map] = note
        // dialog.push(heading(map))
        dialog.push(copyable(`${splitThousandSeparator(i.amount / Math.pow(10, i.decimals), 10, "")} ${i.token} (${splitThousandSeparator(i.asvalue, 2, "$")})`))
        map += ' '
      } else {
        //asvalue is 0 (valueless token or no liqudity)
        const note = `${splitThousandSeparator(i.amount / Math.pow(10, i.decimals), 10, "")} ${i.token} (${splitThousandSeparator(i.asvalue, 2, "$")})`
        // response.insights[map] = note
        // dialog.push(heading(map))
        dialog.push(copyable(note))
        map += ' '
      }
    }
  }
  if (retObj.bundle.in != null) {
    for (let i of retObj.bundle.in) {
      if (i.asvalue != 0) {
        const note = `${splitThousandSeparator(i.amount / Math.pow(10, i.decimals), 10, "")} ${i.token} (${splitThousandSeparator(i.asvalue, 2, "$")})`
        // response.insights[map] = note
        dialog.push(heading(map))
        dialog.push(copyable(note))
        map += ' '
        inValue += i.asvalue
      } else {
        //asvalue is 0 (valueless token or no liqudity)
        const note = `${splitThousandSeparator(i.amount / Math.pow(10, i.decimals), 10, "")} ${i.token} (${splitThousandSeparator(i.asvalue, 2, "$")})`
        // response.insights[map] = note
        dialog.push(heading(map))
        dialog.push(copyable(note))
        map += ' '
        inValue += i.asvalue
      }
    }
  }
  // response.insights[map] = ''
  dialog.push(heading(map))
  // dialog.push(text(' '))
  map += ' '
  // response.insights[map] = ''
  dialog.push(heading(map))
  // dialog.push(text(' '))
  map += ' '


  // security
  dialog.push(divider())

  if ((retObj.security.token == null) &&
    (retObj.security.reciver == null) && 
    (retObj.security.approve == null)
  ) {
    // response.insights['Security Check: Passed'] = ''
    dialog.push(heading('Security Check: Passed ✅'))
    // dialog.push(text(' '))
    // response.insights[map] = ''
    dialog.push(heading(map))
    // dialog.push(text(' '))
    map += ' '
  } else {
    // response.insights['Security Check: Failed'] = ''
    dialog.push(heading('Security Check: Failed 🚨'))
    // dialog.push(text(' '))
    // response.insights[map] = 'Be cautious! The transaction may cause you to lose money.'
    dialog.push(heading(map))
    dialog.push(text('Be cautious! The transaction may cause you to lose money.'))
    map += ' '
  }

  //Security - Reciver
  if (retObj.security.reciver != null) {
    // response.insights[map] = " 🚨 Risky Address Detection"
    dialog.push(heading(map))
    dialog.push(text('🚨 Risky Address Detection'))
    map += ' '
    for (let i of retObj.security.reciver) {
      //str += ` ${i}`
      // response.insights[map] = `-- ${i}`
      dialog.push(heading(map))
      dialog.push(copyable(`${i}`))
      map += ' '
    }
  } else {
    // response.insights[map] = '✅  Risky Address Detection'
    dialog.push(heading(map))
    dialog.push(text('✅  Risky Address Detection'))
    map += ' '
  }

  //Security - Token
  if (retObj.security.token != null) {
    // let str: string = " 🚨 Scam Token Detection"
    // response.insights[map] = str
    dialog.push(heading(map))
    dialog.push(text("🚨 Scam Token Detection"))
    map += ' '
    for (let i of retObj.security.token) {
      // response.insights[map] = `-- ${i}`
      dialog.push(heading(map))
      dialog.push(copyable(`${i}`))
      map += ' '
    }
  } else {
    // response.insights[map] = '✅  Scam Token Detection'
    dialog.push(heading(map))
    dialog.push(text('✅  Scam Token Detection'))
    map += ' '
  }

  //Security - Appr
  if (retObj.security.approve != null) {
    // let str: string = " 🚨 Scam Token Detection"
    // response.insights[map] = str
    dialog.push(heading(map))
    dialog.push(text("🚨 Scam Approve Detection"))
    map += ' '
    for (let i of retObj.security.approve) {
      // response.insights[map] = `-- ${i}`
      dialog.push(heading(map))
      dialog.push(copyable(`Warining: increaseAllowance() detected. Highly likely to be a scam! ${i}`))
      map += ' '
    }
  } else {
    // response.insights[map] = '✅  Scam Token Detection'
    dialog.push(heading(map))
    dialog.push(text('✅  Scam Approve Detection'))
    map += ' '
  }

  const insights = {
    content: panel(dialog),
  };
  console.log(dialog)
  return insights 
}