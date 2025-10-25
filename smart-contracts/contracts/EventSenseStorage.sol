// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EventSenseStorage {
    struct Summary {
        string cid;
        address author;
        uint256 timestamp;
    }

    Summary[] public summaries;
    event SummaryStored(address indexed author, string cid, uint256 timestamp);

    function storeSummary(string memory _cid) public {
        summaries.push(Summary(_cid, msg.sender, block.timestamp));
        emit SummaryStored(msg.sender, _cid, block.timestamp);
    }

    function getSummary(uint256 _index) public view returns (Summary memory) {
        return summaries[_index];
    }

    function totalSummaries() public view returns (uint256) {
        return summaries.length;
    }
}
