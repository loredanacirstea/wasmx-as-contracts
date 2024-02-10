import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { BigInt } from "wasmx-env/assembly/bn"
import * as banktypes from "wasmx-bank/assembly/types"
import * as erc20types from "wasmx-erc20/assembly/types"
import * as blocktypes from "wasmx-blocks/assembly/types"
import * as consensustypes from "wasmx-consensus/assembly/types_tendermint"
import { Deposit, Fraction, MODULE_NAME, MaxMetadataLen, MsgDeposit, MsgEndBlock, MsgInitGenesis, MsgSubmitProposal, MsgSubmitProposalResponse, MsgVote, MsgVoteResponse, MsgVoteWeighted, PROPOSAL_STATUS_DEPOSIT_PERIOD, PROPOSAL_STATUS_FAILED, PROPOSAL_STATUS_PASSED, PROPOSAL_STATUS_REJECTED, PROPOSAL_STATUS_VOTING_PERIOD, Params, Proposal, QueryDepositRequest, QueryDepositsRequest, QueryParamsRequest, QueryParamsResponse, QueryProposalRequest, QueryProposalResponse, QueryProposalsRequest, QueryTallyResultRequest, QueryVoteRequest, QueryVotesRequest, Response, TallyResult, VOTE_OPTION_ABSTAIN, VOTE_OPTION_NO, VOTE_OPTION_NO_WITH_VETO, VOTE_OPTION_UNSPECIFIED, VOTE_OPTION_YES, Vote, VoteOptionMap, WeightedVoteOption } from "./types";
import { addActiveDepositProposal, addActiveVotingProposal, addProposal, addProposalDeposit, addProposalVote, getActiveDepositProposals, getActiveVotingProposals, getParams, getProposal, getProposalIdCount, nextEndingDepositProposals, nextEndingVotingProposals, removeActiveDepositProposal, removeActiveVotingProposal, removeProposal, removeProposalDeposits, setParams, setProposal, setProposalDeposit, setProposalDepositCount, setProposalIdCount } from "./storage";
import { Bech32String, CallRequest, CallResponse, Coin, Event, EventAttribute } from "wasmx-env/assembly/types";
import { LoggerDebug, LoggerInfo, revert } from "./utils";
import { AttributeKeyOption, AttributeKeyProposalID, AttributeKeyProposalMessages, AttributeKeyVoter, AttributeKeyVotingPeriodStart, EventTypeProposalDeposit, EventTypeProposalVote, EventTypeSubmitProposal } from "./events";

// TODO this must be in initialization
const DENOM_BASE = "amyt"
const DENOM_STAKE = "asmyt"

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    setProposalIdCount(req.starting_proposal_id)
    setParams(req.params)

    for (let i = 0; i < req.proposals.length; i++) {
        const proposal = req.proposals[i]
        // TODO validate proposal
        setProposal(proposal.id, proposal)
        if (proposal.status == PROPOSAL_STATUS_DEPOSIT_PERIOD) {
            addActiveDepositProposal(proposal.id)
        }
        if (proposal.status == PROPOSAL_STATUS_VOTING_PERIOD) {
            addActiveVotingProposal(proposal.id)
        }
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

export function EndBlock(req: MsgEndBlock): ArrayBuffer {
    const block = JSON.parse<blocktypes.BlockEntry>(String.UTF8.decode(decodeBase64(req.data).buffer))
    const header = JSON.parse<consensustypes.Header>(String.UTF8.decode(decodeBase64(block.header).buffer))
    const headerTime = Date.fromString(header.time)

    // check deposit period passed and remove inactive proposals, burn deposit
    // we try to promote to voting after every deposit
    // if there are proposals here not promoted, the deposit was not enough
    // so we remove them and burn the deposit
    const activeDeposit = nextEndingDepositProposals(headerTime)
    LoggerDebug(`gov proposals expired deposit`, ["count", activeDeposit.length.toString(), "block_time", headerTime.toISOString()])
    for (let i = 0; i < activeDeposit.length; i++) {
        const proposal = activeDeposit[i]
        // TODO burn the deposit; now the deposit remains in the gov module
        LoggerInfo(`deleting proposal`, ["reason", "deposit period expired", "proposal_id", proposal.id.toString()])
        removeProposal(proposal.id)
        removeProposalDeposits(proposal.id)
    }

    const params = getParams()
    // check voting period passed and finalize proposal
    const activeVoting = nextEndingVotingProposals(headerTime)
    LoggerDebug(`gov proposals ending voting period`, ["count", activeVoting.length.toString()])
    for (let i = 0; i < activeVoting.length; i++) {
        const proposal = activeVoting[i]
        removeActiveVotingProposal(proposal.id)

        // check vote tally and determine proposal status
        const totalStake = callGetTotalStake()
        const decimals = decimalCount(params.quorum)
        const quorum = u64(Math.floor(parseFloat(params.quorum) * Math.pow(10, decimals)))
        const quorumAmount = totalStake.mul(BigInt.fromU64(quorum)).div(BigInt.fromU32(10).pown(decimals))
        // @ts-ignore
        const votedStake = proposal.final_tally_result.yes_count + proposal.final_tally_result.no_count + proposal.final_tally_result.abstain_count + proposal.final_tally_result.no_with_veto_count
        LoggerDebug(`proposal quorum`, ["id", proposal.id.toString(), "total_stake", totalStake.toString(), "quorum", quorumAmount.toString(), "voted_state", votedStake.toString()])

        // check quorum
        if (votedStake < quorumAmount) {
            // proposal failed
            proposal.failed_reason = "lack of quorum"
            proposal.status = PROPOSAL_STATUS_REJECTED
            // TODO give back deposits
            setProposal(proposal.id, proposal);
            LoggerDebug(`proposal failed quorum`, ["id", proposal.id.toString()])
            break;
        }
        // TODO proposal.expedited

        // check no_with_veto
        const decimalsVeto = decimalCount(params.veto_threshold)
        const thresholdVeto = u64(Math.floor(parseFloat(params.veto_threshold) * Math.pow(10, decimalsVeto)))
        const thresholdVetoAmount = votedStake.mul(BigInt.fromU64(thresholdVeto)).div(BigInt.fromU32(10).pown(decimalsVeto))
        LoggerDebug(`proposal veto threshold`, ["id", proposal.id.toString(), "veto_count", proposal.final_tally_result.no_with_veto_count.toString(), "threshold", thresholdVetoAmount.toString()])

        if (proposal.final_tally_result.no_with_veto_count >= thresholdVetoAmount) {
            // we burn the deposits or (now:) leave it in gov contract
            proposal.failed_reason = "vetoed"
            proposal.status = PROPOSAL_STATUS_REJECTED
            setProposal(proposal.id, proposal);
            LoggerDebug(`proposal failed with veto`, ["id", proposal.id.toString()])
            break;
        }

        // check if result is no
        const decimalsThreshold = decimalCount(params.threshold)
        const threshold = u64(Math.floor(parseFloat(params.threshold) * Math.pow(10, decimalsThreshold)))
        const thresholdAmount = votedStake.mul(BigInt.fromU64(threshold)).div(BigInt.fromU32(10).pown(decimalsThreshold))
        LoggerDebug(`proposal yes threshold`, ["id", proposal.id.toString(), "yes_count", proposal.final_tally_result.yes_count.toString(), "threshold", thresholdAmount.toString()])

        if (proposal.final_tally_result.yes_count < thresholdAmount) {
            proposal.failed_reason = "not enough yes votes"
            proposal.status = PROPOSAL_STATUS_REJECTED
            // TODO we return the deposits; (now:) leave them in gov contract
            setProposal(proposal.id, proposal);
            LoggerDebug(`proposal rejected`, ["id", proposal.id.toString()])
            break;
        }

        // proposal passed, we execut messages
        LoggerDebug(`proposal passed`, ["id", proposal.id.toString()])

        // Messages may mutate state thus we use a cached context. If one of
        // the handlers fails, no state mutation is written and the error
        // message is logged.

        // TODO return deposits
        const result = executeProposal(proposal)
        if (result.success) {
            proposal.status = PROPOSAL_STATUS_PASSED
            LoggerDebug(`proposal passed and execution succeeded`, ["id", proposal.id.toString()])
        } else {
            proposal.status = PROPOSAL_STATUS_FAILED
            proposal.failed_reason = result.data
            LoggerDebug(`proposal passed and execution failed`, ["id", proposal.id.toString(), "error", result.data])
        }
        setProposal(proposal.id, proposal);
    }

    return new ArrayBuffer(0)
}

/// tx

export function SubmitProposal(req: MsgSubmitProposal): ArrayBuffer {
    const params = getParams()
    const submitTime = new Date(Date.now());
    const depositEndTime = new Date(submitTime.getTime() + params.max_deposit_period)
    let deposit = req.initial_deposit;
    if (req.initial_deposit.length == 0) {
        deposit = [new Coin(DENOM_BASE, BigInt.zero())]
    }
    const metadata = req.metadata.slice(0, i32(Math.min(MaxMetadataLen, req.metadata.length)))
    const proposal = new Proposal(
        0,
        req.messages,
        PROPOSAL_STATUS_DEPOSIT_PERIOD,
        new TallyResult(BigInt.zero(), BigInt.zero(), BigInt.zero(), BigInt.zero()),
        submitTime,
        depositEndTime,
        deposit,
        new Date(0),
        new Date(0),
        metadata,
        req.title,
        req.summary,
        req.proposer,
        req.expedited,
        "",
    )
    // we only use one type of coin
    if (deposit[0].amount > params.min_deposit[0].amount) {
        proposal.status = PROPOSAL_STATUS_VOTING_PERIOD
        proposal.voting_start_time = new Date(Date.now());
        proposal.voting_end_time = new Date(proposal.voting_start_time.getTime() + params.voting_period)
    }
    const proposal_id = addProposal(proposal);
    if (proposal.status == PROPOSAL_STATUS_DEPOSIT_PERIOD) {
        addActiveDepositProposal(proposal_id)
    } else if (proposal.status == PROPOSAL_STATUS_VOTING_PERIOD) {
        addActiveVotingProposal(proposal_id)
    }

    // transfer deposit from proposer to this contract
    bankSendCoinFromAccountToModule(req.proposer, MODULE_NAME, req.initial_deposit)

    addProposalDeposit(proposal_id, new Deposit(proposal_id, req.proposer, req.initial_deposit))

    const ev = new Event(
        EventTypeSubmitProposal,
        [
            new EventAttribute(AttributeKeyProposalID, proposal_id.toString(), true),
            new EventAttribute(AttributeKeyProposalMessages, req.messages.join(","), true),
        ],
    )
    wasmxw.emitCosmosEvents([ev]);

    return String.UTF8.encode(JSON.stringify<MsgSubmitProposalResponse>(new MsgSubmitProposalResponse(proposal_id)))
}

export function DoVote(req: MsgVote): ArrayBuffer {
    LoggerDebug("vote", ["proposal_id", req.proposal_id.toString(), "option", req.option])
    const proposal = getProposal(req.proposal_id)
    if (proposal == null) {
        revert(`invalid proposal id: ${req.proposal_id.toString()}`)
    }
    if (!VoteOptionMap.has(req.option)) {
        revert(`invalid vote option: ${req.option}`)
    }
    const optionId = VoteOptionMap.get(req.option)
    const option = new WeightedVoteOption(optionId, "1.0");
    const metadata = req.metadata.slice(0, i32(Math.min(MaxMetadataLen, req.metadata.length)))
    addProposalVote(req.proposal_id, new Vote(req.proposal_id, req.voter, [option], metadata))

    // voter stake
    const stake = getStake(req.voter)

    // update proposal tally
    if (optionId == VOTE_OPTION_YES) {
        // @ts-ignore
        proposal!.final_tally_result.yes_count += stake
    } else if (optionId == VOTE_OPTION_ABSTAIN) {
        // @ts-ignore
        proposal!.final_tally_result.abstain_count += stake
    } else if (optionId == VOTE_OPTION_NO) {
        // @ts-ignore
        proposal!.final_tally_result.no_count += stake
    } else if (optionId == VOTE_OPTION_NO_WITH_VETO) {
        // @ts-ignore
        proposal!.final_tally_result.no_with_veto_count += stake
    }
    setProposal(proposal!.id, proposal!)

    const ev = new Event(
        EventTypeProposalVote,
        [
            new EventAttribute(AttributeKeyVoter, req.voter, true),
            new EventAttribute(AttributeKeyOption, JSON.stringify<WeightedVoteOption[]>([option]), true),
            new EventAttribute(AttributeKeyProposalID, proposal!.id.toString(), true),
        ],
    )
    wasmxw.emitCosmosEvents([ev]);

    return String.UTF8.encode(JSON.stringify<MsgVoteResponse>(new MsgVoteResponse()))
}

export function VoteWeighted(req: MsgVoteWeighted): ArrayBuffer {
    const proposal = getProposal(req.proposal_id)
    if (proposal == null) {
        revert(`invalid proposal id: ${req.proposal_id.toString()}`)
    }
    if (proposal!.status != PROPOSAL_STATUS_VOTING_PERIOD) {
        revert(`cannot vote, proposal is in status: ${proposal!.status}`)
    }
    const metadata = req.metadata.slice(0, i32(Math.min(MaxMetadataLen, req.metadata.length)))
    // add vote
    addProposalVote(req.proposal_id, new Vote(req.proposal_id, req.voter, req.option, metadata))

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
            proposal!.final_tally_result.yes_count += amount
        } else if (opt.option == VOTE_OPTION_ABSTAIN) {
            // @ts-ignore
            proposal!.final_tally_result.abstain_count += amount
        } else if (opt.option == VOTE_OPTION_NO) {
            // @ts-ignore
            proposal!.final_tally_result.no_count += amount
        } else if (opt.option == VOTE_OPTION_NO_WITH_VETO) {
            // @ts-ignore
            proposal!.final_tally_result.no_with_veto_count += amount
        }
    }

    // TODO check

    setProposal(proposal!.id, proposal!)

    const ev = new Event(
        EventTypeProposalVote,
        [
            new EventAttribute(AttributeKeyVoter, req.voter, true),
            new EventAttribute(AttributeKeyOption, JSON.stringify<WeightedVoteOption[]>(req.option), true),
            new EventAttribute(AttributeKeyProposalID, proposal!.id.toString(), true),
        ],
    )
    wasmxw.emitCosmosEvents([ev]);

    return String.UTF8.encode(JSON.stringify<MsgVoteResponse>(new MsgVoteResponse()))
}

export function DoDeposit(req: MsgDeposit): ArrayBuffer {
    const proposal = getProposal(req.proposal_id)
    if (proposal == null) {
        revert(`invalid proposal id: ${req.proposal_id.toString()}`)
    }
    if (proposal!.status != PROPOSAL_STATUS_DEPOSIT_PERIOD) {
        revert(`cannot deposit, proposal is in status: ${proposal!.status}`)
    }

    // transfer deposit from proposer to this contract
    bankSendCoinFromAccountToModule(req.depositor, MODULE_NAME, req.amount)

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
    const params = getParams()
    // we only use one type of coin
    if (proposal!.total_deposit[0].amount > params.min_deposit[0].amount) {
        proposal!.status = PROPOSAL_STATUS_VOTING_PERIOD
        proposal!.voting_start_time = new Date(Date.now());
        proposal!.voting_end_time = new Date(proposal!.voting_start_time.getTime() + params.voting_period)
        addActiveVotingProposal(proposal!.id)
        removeActiveDepositProposal(proposal!.id)

        const ev = new Event(
            EventTypeProposalDeposit,
            [
                new EventAttribute(AttributeKeyVotingPeriodStart, proposal!.id.toString(), true),
            ],
        )
        wasmxw.emitCosmosEvents([ev]);
    }
    setProposal(proposal!.id, proposal!)
    return new ArrayBuffer(0)
}

/// queries

export function GetProposal(req: QueryProposalRequest): ArrayBuffer {
    const proposal = getProposal(req.proposal_id)
    let response = `{"proposal":null}`
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
    const params = getParams()
    const response = new QueryParamsResponse(params)
    return String.UTF8.encode(JSON.stringify<QueryParamsResponse>(response))
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

function executeProposal(proposal: Proposal): Response {
    for (let i = 0; i < proposal.messages.length; i++) {
        const msg = String.UTF8.decode(decodeBase64(proposal.messages[i]).buffer)
        const response = wasmxw.executeCosmosMsg(msg, MODULE_NAME)

        if (response.success > 0) {
            return new Response(false, response.data)
        }
    }
    return new Response(true, "")
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
    return balance.balance.amount
}

export function callGetTotalStake(): BigInt {
    const tokenAddress = getTokenAddress(DENOM_STAKE)
    const calldatastr = `{"totalSupply":{}}`;
    const resp = callContract(tokenAddress, calldatastr, false)
    if (resp.success > 0) {
        revert(`delegation not found`)
    }
    const balance = JSON.parse<erc20types.MsgTotalSupplyResponse>(resp.data)
    return balance.supply.amount
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
