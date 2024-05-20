import { JSON } from "json-as/assembly";

// @ts-ignore
@serializable
export class GroupInfo {
    // TODO
}

// @ts-ignore
@serializable
export class GroupMember {
    // TODO
}

// @ts-ignore
@serializable
export class GroupPolicyInfo {
    // TODO
}

// @ts-ignore
@serializable
export class Proposal {
    // TODO
}

// @ts-ignore
@serializable
export class Vote {
    // TODO
}

// @ts-ignore
@serializable
export class GenesisState {
    group_seq: u64
    groups: GroupInfo[]
    group_members: GroupMember[]
    group_policy_seq: u64
	group_policies: GroupPolicyInfo[]
	proposal_seq: u64
	proposals: Proposal[]
	votes: Vote[]
    constructor(
        group_seq: u64,
        groups: GroupInfo[],
        group_members: GroupMember[],
        group_policy_seq: u64,
        group_policies: GroupPolicyInfo[],
        proposal_seq: u64,
        proposals: Proposal[],
        votes: Vote[],
    ) {
        this.group_seq = group_seq
        this.groups = groups
        this.group_members = group_members
        this.group_policy_seq = group_policy_seq
        this.group_policies = group_policies
        this.proposal_seq = proposal_seq
        this.proposals = proposals
        this.votes = votes
    }
}

export function getDefaultGenesis(): GenesisState {
    return new GenesisState(0, [], [], 0, [], 0, [], [])
}
