import { JSON } from "json-as/assembly";
import { encode as encodeBase64, decode as decodeBase64 } from "as-base64/assembly";
import * as wasmxw from "wasmx-env/assembly/wasmx_wrap"
import { BigInt } from "wasmx-env/assembly/bn"
import * as govstorage from "wasmx-gov/assembly/storage"
import * as gov from "wasmx-gov/assembly/types"
import { MsgDeposit, MsgEndBlock, MsgSubmitProposal, MsgVote, MsgVoteWeighted, QueryDepositRequest, QueryDepositsRequest, QueryParamsRequest, QueryProposalRequest, QueryProposalsRequest, QueryTallyResultRequest, QueryVoteRequest, QueryVotesRequest } from "wasmx-gov/assembly/types";
import { Coefs, DepositVote, MODULE_NAME, MsgAddProposalOption, MsgInitGenesis, MsgSubmitProposalExtended, Params, Proposal, ProposalOption, ProposalVoteStatus, QueryProposalExtendedResponse, VoteStatus } from "./types";
import { LoggerDebug, LoggerInfo, revert } from "./utils";
import { addProposal, addProposalVote, getParams, getProposal, setParams, setProposal } from "./storage";
import { bankSendCoinFromAccountToModule } from "wasmx-gov/assembly/actions";
import { Coin, Event, EventAttribute } from "wasmx-env/assembly/types";
import { AttributeKeyOption, AttributeKeyProposalID, AttributeKeyProposalMessages, AttributeKeyVoter, EventTypeProposalVote, EventTypeSubmitProposal } from "wasmx-gov/assembly/events";
import { AttributeKeyOptionID, EventTypeAddProposalOption, EventTypeExecuteProposal } from "./events";

// TODO this must be in initialization

const OPTION_ID_START = 1

export function InitGenesis(req: MsgInitGenesis): ArrayBuffer {
    LoggerInfo("initiating genesis", [])
    // TODO deploy arbitration denom, controlled by this contract
    // TODO deply initiated laurel ids or they must be already registered with the bank
    govstorage.setProposalIdFirst(req.starting_proposal_id)
    govstorage.setProposalIdLast(req.starting_proposal_id + i64(req.proposals.length)-1)
    govstorage.setProposalIdCount(i64(req.proposals.length))
    govstorage.setParams(req.params)

    for (let i = 0; i < req.proposals.length; i++) {
        const proposal = req.proposals[i]
        // TODO validate proposal
        setProposal(proposal.id, proposal)
    }
    for (let i = 0; i < req.deposits.length; i++) {
        const deposit = req.deposits[i]
        govstorage.addProposalDeposit(deposit.proposal_id, deposit)
    }
    for (let i = 0; i < req.votes.length; i++) {
        const vote = req.votes[i]
        addProposalVote(vote.proposal_id, vote)
    }
    LoggerInfo("initiated genesis", ["proposals", req.proposals.length.toString(), "deposits", req.deposits.length.toString(), "votes", req.votes.length.toString()])
    return new ArrayBuffer(0)
}

export function EndBlock(req: MsgEndBlock): ArrayBuffer {
    // const block = JSON.parse<blocktypes.BlockEntry>(String.UTF8.decode(decodeBase64(req.data).buffer))
    // const header = JSON.parse<consensustypes.Header>(String.UTF8.decode(decodeBase64(block.header).buffer))
    // const headerTime = Date.fromString(header.time)

    // TODO check if there are proposals to be executed and execute them here instead of after a vote
    // gas cost should be paid by the proposal's deposits

    return new ArrayBuffer(0)
}

/// tx

export function SubmitProposal(req: MsgSubmitProposal): ArrayBuffer {
    const localparams = getParams()
    LoggerDebug("submit proposal", ["title", req.title])
    return SubmitProposalInternal(new MsgSubmitProposalExtended(req, localparams.defaultX, localparams.defaultY, req.title, req.summary, req.metadata), localparams);
}

export function SubmitProposalExtended(req: MsgSubmitProposalExtended): ArrayBuffer {
    LoggerDebug("submit proposal extended", ["title", req.title])
    const localparams = getParams()
    // only arbiters can propose custom coefficients
    let hasArbitration = false
    for (let i = 0; i < req.initial_deposit.length; i++) {
        if (req.initial_deposit[i].denom == localparams.arbitrationDenom && req.initial_deposit[i].amount > BigInt.fromU32(1)) {
            hasArbitration = true;
        }
    }
    if (!hasArbitration) {
        revert(`only arbiters can propose custom curves for proposals`)
    }
    return SubmitProposalInternal(req, localparams);
}

export function SubmitProposalInternal(req: MsgSubmitProposalExtended, localparams: Params): ArrayBuffer {
    const submitTime = new Date(Date.now());
    const depositEndTime = submitTime;
    if (req.initial_deposit.length == 0) {
        revert(`proposal must contain a deposit`)
    }
    if (req.initial_deposit.length >= 2) {
        revert(`proposal contains too many denoms`)
    }

    // call bank to subtract the deposit
    // transfer deposit from proposer to this contract
    // reverts if not enough balance
    bankSendCoinFromAccountToModule(req.proposer, MODULE_NAME, req.initial_deposit)

    let proposalCoin: Coin = new Coin("", BigInt.zero())
    let arbitrationAmount = BigInt.zero();
    for (let i = 0; i < req.initial_deposit.length; i++) {
        if (req.initial_deposit[i].denom == localparams.arbitrationDenom) {
            arbitrationAmount = req.initial_deposit[i].amount
            continue;
        } else {
            proposalCoin = req.initial_deposit[i]
        }
    }
    if (proposalCoin.denom == "" || proposalCoin.amount.isZero()) {
        revert(`proposal must have a deposit`)
    }

    const proposalOption = new ProposalOption(req.proposer, req.messages, proposalCoin.amount, arbitrationAmount, req.optionTitle, req.optionSummary, req.optionMetadata);
    const emptyOption = new ProposalOption("", [], BigInt.zero(), BigInt.zero(), "", "", "")

    const metadata = req.metadata.slice(0, i32(Math.min(gov.MaxMetadataLen, req.metadata.length)))

    let proposal = new Proposal(
        0,
        // req.messages,
        gov.PROPOSAL_STATUS_VOTING_PERIOD,
        // [], // former tally
        submitTime,
        depositEndTime,
        new Date(Date.now()),
        new Date(0),
        metadata,
        req.title,
        req.summary,
        req.proposer,
        "",
        req.x,
        req.y,
        proposalCoin.denom,
        [emptyOption, proposalOption],
        new ProposalVoteStatus(0, 0, 0, false),
        0, // winner
    )
    // fill in proposalVoteStatus
    proposal = setProposalVoteStatus(proposal, localparams);
    const proposal_id = addProposal(proposal);

    addProposalVote(proposal_id, new DepositVote(proposal_id, OPTION_ID_START, req.proposer, proposalCoin.amount, arbitrationAmount, proposalOption.metadata))

    wasmxw.emitCosmosEvents([
        new Event(
            EventTypeSubmitProposal,
            [
                new EventAttribute(AttributeKeyProposalID, proposal_id.toString(), true),
                new EventAttribute(AttributeKeyProposalMessages, req.messages.join(","), true),
            ],

        ),
        new Event(
            EventTypeAddProposalOption,
            [
                new EventAttribute(AttributeKeyProposalID, proposal_id.toString(), true),
                new EventAttribute(AttributeKeyOption, JSON.stringify<ProposalOption>(proposalOption), true),
            ],
        ),
    ]);

    return String.UTF8.encode(JSON.stringify<gov.MsgSubmitProposalResponse>(new gov.MsgSubmitProposalResponse(proposal_id)))
}

export function AddProposalOption(req: MsgAddProposalOption): ArrayBuffer {
    const localparams = getParams()
    let proposal = getProposal(req.proposal_id)
    if (!proposal) {
        revert(`proposal not found`)
        return new ArrayBuffer(0)
    }
    const option_id = proposal.options.length
    LoggerDebug("submit proposal option", ["proposal_id", req.proposal_id.toString(), "option_id", option_id.toString(), "title", req.option.title])

    proposal.options.push(req.option);

    // lock funds
    const deposit = [new Coin(proposal.denom, req.option.amount), new Coin(localparams.arbitrationDenom, req.option.arbitrationAmount)]
    bankSendCoinFromAccountToModule(req.option.proposer, MODULE_NAME, deposit)

    // calculate new proposal voting status
    proposal = setProposalVoteStatus(proposal, localparams);

    // save proposal with new option
    setProposal(req.proposal_id, proposal);
    // save vote data; TODO redundant? should we index by voter address?
    const vote = new DepositVote(req.proposal_id, option_id, req.option.proposer, req.option.amount, req.option.arbitrationAmount, req.option.metadata)
    addProposalVote(req.proposal_id, vote)

    wasmxw.emitCosmosEvents([
        new Event(
            EventTypeAddProposalOption,
            [
                new EventAttribute(AttributeKeyProposalID, req.proposal_id.toString(), true),
                new EventAttribute(AttributeKeyOptionID, option_id.toString(), true),
                new EventAttribute(AttributeKeyOption, JSON.stringify<ProposalOption>(req.option), true),
            ],
        ),
        new Event(
            EventTypeProposalVote,
            [
                new EventAttribute(AttributeKeyVoter, req.option.proposer, true),
                new EventAttribute(AttributeKeyOption, JSON.stringify<DepositVote>(vote), true),
                new EventAttribute(AttributeKeyProposalID, proposal!.id.toString(), true),
            ],
        )
    ]);

    tryExecuteProposal(proposal);
    return new ArrayBuffer(0)
}

export function DoVote(req: MsgVote): ArrayBuffer {
    revert(`Vote not available; use "depositVote"`)
    return new ArrayBuffer(0)
}

export function VoteWeighted(req: MsgVoteWeighted): ArrayBuffer {
    revert(`VoteWeighted not available; use "depositVote"`)
    return new ArrayBuffer(0)
}

export function DoDeposit(req: MsgDeposit): ArrayBuffer {
    revert(`Deposit not available; use "depositVote"`)
    return new ArrayBuffer(0)
}

export function DoDepositVote(req: DepositVote): ArrayBuffer {
    const localparams = getParams()
    let proposal = getProposal(req.proposal_id)
    if (!proposal) {
        revert(`proposal not found`)
        return new ArrayBuffer(0)
    }
    if (req.option_id >= proposal.options.length) {
        revert(`invalid option`)
        return new ArrayBuffer(0)
    }

    const deposit = [new Coin(proposal.denom, req.amount), new Coin(localparams.arbitrationDenom, req.arbitrationAmount)]
    bankSendCoinFromAccountToModule(req.voter, MODULE_NAME, deposit)

    // add deposit to proposal option
    proposal.options[req.option_id].amount = proposal.options[req.option_id].amount.add(req.amount)
    proposal.options[req.option_id].arbitrationAmount = proposal.options[req.option_id].arbitrationAmount.add(req.arbitrationAmount)

    LoggerDebug("deposit vote", ["proposal_id", req.proposal_id.toString(), "option_id", req.option_id.toString(), "option_deposit",  proposal.options[req.option_id].amount.toString(), "option_arbitration", proposal.options[req.option_id].arbitrationAmount.toString()])

    // calculate new proposal voting status
    proposal = setProposalVoteStatus(proposal, localparams);

    addProposalVote(req.proposal_id, req)
    setProposal(req.proposal_id, proposal)

    wasmxw.emitCosmosEvents([
        new Event(
            EventTypeProposalVote,
            [
                new EventAttribute(AttributeKeyVoter, req.voter, true),
                new EventAttribute(AttributeKeyOptionID, req.option_id.toString(), true),
                new EventAttribute(AttributeKeyProposalID, proposal!.id.toString(), true),
            ],
        )
    ]);

    tryExecuteProposal(proposal)

    return new ArrayBuffer(0)
}

/// queries

export function GetProposal(req: QueryProposalRequest): ArrayBuffer {
    const proposal = getProposal(req.proposal_id)
    let response = `{"proposal":null}`

    if (proposal != null) {
        const govprop = proposalToExternal(proposal)
        response = JSON.stringify<gov.QueryProposalResponse>(new gov.QueryProposalResponse(govprop))
    }
    return String.UTF8.encode(response)
}

export function GetProposalExtended(req: QueryProposalRequest): ArrayBuffer {
    const proposal = getProposal(req.proposal_id)
    let response = `{"proposal":null}`

    if (proposal != null) {
        response = JSON.stringify<QueryProposalExtendedResponse>(new QueryProposalExtendedResponse(proposal))
    }
    return String.UTF8.encode(response)
}

// TODO pagination
const PAGE_LIMIT = 100
export function GetProposals(req: QueryProposalsRequest): ArrayBuffer {
    const lasId = govstorage.getProposalIdLast()
    const firstId = govstorage.getProposalIdFirst()
    const count = govstorage.getProposalIdCount()
    const proposals: gov.Proposal[] = new Array<gov.Proposal>(0)
    for (let i = firstId; i <= lasId; i++) {
        const prop = getProposal(i);
        if(prop != null) {
            // if (req.proposal_status != "" && gov.ProposalStatusMap.has(req.proposal_status) && prop.status == gov.ProposalStatusMap.get(req.proposal_status)) {
                console.debug("-GetProposals yes-" + i.toString())
                proposals.push(proposalToExternal(prop));
            // }
        }
    }
    const response = JSON.stringify<gov.QueryProposalsResponse>(new gov.QueryProposalsResponse(proposals, new gov.PageResponse(count)))
    return String.UTF8.encode(response)
}

export function GetVote(req: QueryVoteRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetVotes(req: QueryVotesRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetDeposit(req: QueryDepositRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetDeposits(req: QueryDepositsRequest): ArrayBuffer {
    return new ArrayBuffer(0)
}

export function GetTallyResult(req: QueryTallyResultRequest): ArrayBuffer {
    const proposal = getProposal(req.proposal_id)
    let response = `{"tally":null}`
    if (proposal != null) {
        const params = getParams()
        response = JSON.stringify<gov.QueryTallyResultResponse>(new gov.QueryTallyResultResponse(tallyToExternal(proposal, params)))
    }
    return String.UTF8.encode(response)
}

function tryExecuteProposal(proposal: Proposal): void {
    if (!proposal.vote_status.changed) return;

    const result = executeProposal(proposal);
    if (result != null) {
        if (!result.success) {
            proposal.failed_reason = result.data;
        } else {
            proposal.failed_reason = ""
            wasmxw.emitCosmosEvents([
                new Event(
                    EventTypeExecuteProposal,
                    [
                        new EventAttribute(AttributeKeyProposalID, proposal!.id.toString(), true),
                        new EventAttribute(AttributeKeyOption, proposal.winner.toString(), true),
                    ],
                )
            ]);
        }
        setProposal(proposal.id, proposal)
    }
}

function executeProposal(proposal: Proposal): gov.Response {
    const messages = proposal.options[proposal.winner].messages;
    for (let i = 0; i < messages.length; i++) {
        const msg = String.UTF8.decode(decodeBase64(messages[i]).buffer)
        const response = wasmxw.executeCosmosMsg(msg, MODULE_NAME)
        if (response.success > 0) {
            return new gov.Response(false, response.data)
        }
    }
    return new gov.Response(true, "")
}

function setProposalVoteStatus(proposal: Proposal, params: Params): Proposal {
    const nextStatus = getProposalVoteStatus(proposal, params)
    proposal.vote_status = nextStatus;
    const winner = getWinner(proposal.winner, nextStatus);
    if (proposal.winner != winner) {
        proposal.vote_status.changed = true;
    }
    proposal.winner = winner;
    return proposal
}

// winner is the option index
function getWinner (prevWinner: u32, nextStatus: ProposalVoteStatus): u32 {
    if (nextStatus.status == 1) return nextStatus.xi;
    if (nextStatus.status == 2) return nextStatus.yi;
    return prevWinner;
}

function getProposalVoteStatus(proposal: Proposal, params: Params): ProposalVoteStatus {
    const normalizedWeights = normalizeTally(proposal, params)
    if (normalizedWeights.length == 0) return new ProposalVoteStatus(0, 0, 0, false);

    // max weight index
    const xi: i32 = getMaxFromArray(normalizedWeights);
    // gets the second max
    const yi = getMaxFromArrayExcept(normalizedWeights, xi);
    const status = getVoteStatus(normalizedWeights[xi], normalizedWeights[yi], proposal, params);
    return new ProposalVoteStatus(status, xi, yi, false);
}

function getMaxFromArray (arr: BigInt[]): i32 {
    let index: i32 = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > arr[index]) index = i;
    }
    return index;
}

function getMaxFromArrayExcept (arr: BigInt[], pos: i32): i32 {
    let index: i32 = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > arr[index] && pos != i) index = i;
    }
    return index;
}

function normalizeTally(proposal: Proposal, params: Params): Array<BigInt> {
    const tally = new Array<BigInt>(proposal.options.length)
    for (let i = 0; i < proposal.options.length; i++) {
        const weight = normalizeOptionTally(proposal.options[i], params)
        tally[i] = weight;
    }
    return tally
}

function normalizeOptionTally(option: ProposalOption, params: Params): BigInt {
    // TODO
    // _WL + _AL * tasks[taskid].amount * coefs[uint256(Coefs.cAL)] / (10 ** decimals);
    // @ts-ignore
    return option.amount + option.arbitrationAmount * BigInt.fromU64(params.coefs[Coefs.cAL])
}

// 0: nobody won
// 1: x option wins (x_threshold <-> x axis)
// 2: y option wins (y_threshold <-> y axis)
// 3: undecidable, leaning towards x (middleline <-> x_threshold)
// 4: undecidable, leaning towards y (middleline <-> y_threshold)
// y|2  /4
//  |  /
//  | /     3
//  |/______1
//         x
export function getVoteStatus (x: BigInt, y: BigInt, p: Proposal, params: Params): VoteStatus {
    if (x == BigInt.zero() && y == BigInt.zero()) return 0;
    if (y == BigInt.zero()) return 1;
    if (x == BigInt.zero()) return 2;
    const PRECISION = BigInt.fromU64(params.coefs[Coefs.precision]);
    // @ts-ignore
    const r1: BigInt = BigInt.fromU64(p.x) * PRECISION / BigInt.fromU64(p.y);
    // @ts-ignore
    if (x * PRECISION / y >= r1) return 1;
    // @ts-ignore
    if (y * PRECISION / x >= r1) return 2;

    const midline = PRECISION;
    // @ts-ignore
    if (x * PRECISION / y >= midline) return 3;
    return 4;
}

function proposalToExternal(proposal: Proposal): gov.Proposal {
    const localparams = getParams()
    let deposit: Coin = new Coin(proposal.denom, BigInt.zero())
    let arbCoin = new Coin(localparams.arbitrationDenom, BigInt.zero())
    for (let i = 1; i < proposal.options.length; i++) {
        const opt = proposal.options[i]
        // @ts-ignore
        deposit.amount = deposit.amount + opt.amount
        // @ts-ignore
        arbCoin.amount = arbCoin.amount + opt.arbitrationAmount
    }
    const govprop = new gov.Proposal(
        proposal.id,
        proposal.options[proposal.winner].messages,
        proposal.status,
        tallyToExternal(proposal, localparams),
        proposal.submit_time,
        proposal.deposit_end_time,
        [deposit, arbCoin],
        proposal.voting_start_time,
        proposal.voting_end_time,
        proposal.metadata,
        proposal.title,
        proposal.summary,
        proposal.proposer,
        false,
        proposal.failed_reason,
    )
    return govprop
}

function tallyToExternal(proposal: Proposal, localparams: Params): gov.TallyResult {
    return new gov.TallyResult(
        normalizeOptionTally(proposal.options[proposal.vote_status.xi], localparams),
        BigInt.zero(),
        normalizeOptionTally(proposal.options[proposal.vote_status.yi], localparams),
        BigInt.zero(),
    )
}
