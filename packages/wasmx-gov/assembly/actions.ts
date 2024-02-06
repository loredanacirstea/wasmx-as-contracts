import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { BigInt } from "wasmx-env/assembly/bn"
import * as banktypes from "wasmx-bank/assembly/types"
import * as erc20types from "wasmx-erc20/assembly/types"
import { Deposit, Fraction, MODULE_NAME, MsgDeposit, MsgInitGenesis, MsgSubmitProposal, MsgVote, MsgVoteWeighted, PROPOSAL_STATUS_DEPOSIT_PERIOD, PROPOSAL_STATUS_VOTING_PERIOD, Params, Proposal, QueryDepositRequest, QueryDepositsRequest, QueryParamsRequest, QueryProposalRequest, QueryProposalResponse, QueryProposalsRequest, QueryTallyResultRequest, QueryVoteRequest, QueryVotesRequest, TallyResult, VOTE_OPTION_ABSTAIN, VOTE_OPTION_NO, VOTE_OPTION_NO_WITH_VETO, VOTE_OPTION_UNSPECIFIED, VOTE_OPTION_YES, Vote } from "./types";
import { addProposal, addProposalDeposit, addProposalVote, getParams, getProposal, getProposalIdCount, setParams, setProposal, setProposalDeposit, setProposalDepositCount, setProposalIdCount } from "./storage";
import { Bech32String, CallRequest, CallResponse, Coin } from "wasmx-env/assembly/types";
import { revert } from "./utils";

// TODO this must be in initialization
const DENOM_BASE = "amyt"
const DENOM_STAKE = "asmyt"

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    setProposalIdCount(req.starting_proposal_id)
    setParams(new Params(req.voting_params, req.deposit_params, req.tally_params))

    for (let i = 0; i < req.proposals.length; i++) {
        const proposal = req.proposals[i]
        setProposal(proposal.proposal_id, proposal)
    }
    for (let i = 0; i < req.deposits.length; i++) {
        const deposit = req.deposits[i]
        addProposalDeposit(deposit.proposal_id, deposit)
    }
    for (let i = 0; i < req.votes.length; i++) {
        const vote = req.votes[i]
        addProposalVote(vote.proposal_id, vote)
    }
    return new ArrayBuffer(0)
}

/// tx

export function SubmitProposal(req: MsgSubmitProposal): ArrayBuffer {
    const params = getParams()
    const timenow = new Date(Date.now());
    const proposal = new Proposal(
        0,
        req.content,
        PROPOSAL_STATUS_DEPOSIT_PERIOD,
        new TallyResult(BigInt.zero(), BigInt.zero(), BigInt.zero(), BigInt.zero()),
        timenow,
        new Date(timenow.getTime() + params.deposit_params.max_deposit_period),
        req.initial_deposit,
        new Date(0),
        new Date(0),
    )
    const proposal_id = addProposal(proposal);

    // transfer deposit from proposer to this contract
    bankSendCoinFromAccountToModule(req.proposer, MODULE_NAME, req.initial_deposit)

    addProposalDeposit(proposal_id, new Deposit(proposal_id, req.proposer, req.initial_deposit))

    return new ArrayBuffer(0)
}

export function DoVote(req: MsgVote): ArrayBuffer {
    const proposal = getProposal(req.proposal_id)
    if (proposal == null) {
        revert(`invalid proposal id: ${req.proposal_id.toString()}`)
    }
    // add vote
    addProposalVote(req.proposal_id, new Vote(req.proposal_id, req.voter, req.option, []))

    // voter stake
    const stake = getStake(req.voter)

    // update proposal tally
    if (req.option == VOTE_OPTION_YES) {
        // @ts-ignore
        proposal!.final_tally_result.yes += stake
    } else if (req.option == VOTE_OPTION_ABSTAIN) {
        // @ts-ignore
        proposal!.final_tally_result.abstain += stake
    } else if (req.option == VOTE_OPTION_NO) {
        // @ts-ignore
        proposal!.final_tally_result.no += stake
    } else if (req.option == VOTE_OPTION_NO_WITH_VETO) {
        // @ts-ignore
        proposal!.final_tally_result.no_with_veto += stake
    }
    setProposal(proposal!.proposal_id, proposal!)
    return new ArrayBuffer(0)
}

export function VoteWeighted(req: MsgVoteWeighted): ArrayBuffer {
    const proposal = getProposal(req.proposal_id)
    if (proposal == null) {
        revert(`invalid proposal id: ${req.proposal_id.toString()}`)
    }
    if (proposal!.status != PROPOSAL_STATUS_VOTING_PERIOD) {
        revert(`cannot vote, proposal is in status: ${proposal!.status}`)
    }
    // add vote
    addProposalVote(req.proposal_id, new Vote(req.proposal_id, req.voter, VOTE_OPTION_UNSPECIFIED, req.option))

    // voter stake
    const stake = getStake(req.voter)

    for (let i = 0; i < req.option.length; i++) {
        const opt = req.option[i]
        const weight = parseFloat(opt.weight)
        const decimals = decimalCount(opt.weight)
        const weightInt = u64(Math.floor(weight * Math.pow(10, decimals)))
        const amount = stake.mul(BigInt.fromU64(weightInt)).div(BigInt.fromU32(10).pown(decimals))
        // update proposal tally
        if (opt.option == VOTE_OPTION_YES) {
            // @ts-ignore
            proposal!.final_tally_result.yes += amount
        } else if (opt.option == VOTE_OPTION_ABSTAIN) {
            // @ts-ignore
            proposal!.final_tally_result.abstain += amount
        } else if (opt.option == VOTE_OPTION_NO) {
            // @ts-ignore
            proposal!.final_tally_result.no += amount
        } else if (opt.option == VOTE_OPTION_NO_WITH_VETO) {
            // @ts-ignore
            proposal!.final_tally_result.no_with_veto += amount
        }
    }

    // TODO check

    setProposal(proposal!.proposal_id, proposal!)
    return new ArrayBuffer(0)
}

export function DoDeposit(req: MsgDeposit): ArrayBuffer {
    const proposal = getProposal(req.proposal_id)
    if (proposal == null) {
        revert(`invalid proposal id: ${req.proposal_id.toString()}`)
    }
    if (proposal!.status != PROPOSAL_STATUS_DEPOSIT_PERIOD) {
        revert(`cannot deposit, proposal is in status: ${proposal!.status}`)
    }
    // add deposit
    addProposalDeposit(req.proposal_id, new Deposit(req.proposal_id, req.depositor, req.amount))

    // update total proposal deposit
    const totalDeposit = proposal!.total_deposit
    const totalDepositLen = totalDeposit.length
    for (let i = 0; i < req.amount.length; i++) {
        let found = false
        for (let j = 0; j < totalDepositLen; j++) {
            if (req.amount[i].denom == totalDeposit[j].denom) {
                // @ts-ignore
                proposal!.total_deposit[j].amount += req.amount[i].amount
                found = true
                break;
            }
        }
        if (!found) {
            proposal!.total_deposit.push(req.amount[i])
        }
    }
    setProposal(proposal!.proposal_id, proposal!)
    return new ArrayBuffer(0)
}

/// queries

export function GetProposal(req: QueryProposalRequest): ArrayBuffer {
    const proposal = getProposal(req.proposal_id)
    let response = `{}`
    if (proposal != null) {
        response = JSON.stringify<QueryProposalResponse>(new QueryProposalResponse(proposal))
    }
    return String.UTF8.encode(response)
}

export function GetProposals(req: QueryProposalsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetVote(req: QueryVoteRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetVotes(req: QueryVotesRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetParams(req: QueryParamsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetDeposit(req: QueryDepositRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetDeposits(req: QueryDepositsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetTallyResult(req: QueryTallyResultRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

function bankSendCoinFromAccountToModule (from: Bech32String, to: Bech32String, coins: Coin[]): void {
    const valuestr = JSON.stringify<banktypes.MsgSend>(new banktypes.MsgSend(from, to, coins))
    const calldata = `{"SendCoinsFromAccountToModule":${valuestr}}`
    const resp = callBank(calldata, false);
    if (resp.success > 0) {
        revert(`could not transfer coins by bank: ${resp.data}`);
    }
}

export function getStake(voter: Bech32String): BigInt {
    const addr = getTokenAddress(DENOM_STAKE)
    return callGetStake(addr, voter)
}

// TODO this should be through the alias contract
export function getTokenAddress(denom: string): Bech32String {
    const calldata = new banktypes.QueryAddressByDenom(denom);
    const calldatastr = `{"GetAddressByDenom":${JSON.stringify<banktypes.QueryAddressByDenom>(calldata)}}`;
    const resp = callBank(calldatastr, true)
    if (resp.success > 0) {
        revert(`could not get staking token address: ${resp.data}`)
    }
    const result = JSON.parse<banktypes.QueryAddressByDenomResponse>(resp.data)
    return result.address
}

export function callBank(calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest("bank", calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function callGetStake(tokenAddress: Bech32String, delegator: Bech32String): BigInt {
    const calldatastr = `{"balanceOf":{"owner":"${delegator}"}}`;
    const resp = callContract(tokenAddress, calldatastr, false)
    if (resp.success > 0) {
        revert(`delegation not found`)
    }
    const balance = JSON.parse<erc20types.MsgBalanceOfResponse>(resp.data)
    return balance.balance
}

export function callContract(addr: Bech32String, calldata: string, isQuery: boolean): CallResponse {
    const req = new CallRequest(addr, calldata, BigInt.zero(), 100000000, isQuery);
    const resp = wasmxw.call(req, MODULE_NAME);
    // result or error
    resp.data = String.UTF8.decode(decodeBase64(resp.data).buffer);
    return resp;
}

export function decimalCount(val: string): u32 {
    const parts = val.split(".")
    const dec = parts[1]
    if (parseInt(dec) == 0) return 0;
    let decimals = u32(dec.length)
    // remove tail zeroes if exist
    for (let i = dec.length - 1; i >= 0; i--) {
        if (dec.slice(i, i+1) == "0") {
            decimals -= 1;
        } else {
            break
        }
    }
    return decimals
}
