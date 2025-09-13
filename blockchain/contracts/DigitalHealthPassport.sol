// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title DigitalHealthPassport
 * @dev Smart contract for storing immutable health records on blockchain
 * @notice Health records are stored as IPFS hashes with role-based access control
 */
contract DigitalHealthPassport is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant EMERGENCY_DOCTOR_ROLE = keccak256("EMERGENCY_DOCTOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Counter for record IDs
    Counters.Counter private _recordIdCounter;
    
    // Health record structure
    struct HealthRecord {
        uint256 recordId;
        address patientAddress;
        string ipfsHash;
        uint256 timestamp;
        string recordType; // "eye_test", "prescription", "diagnosis", etc.
        bool isActive;
    }
    
    // Mappings
    mapping(uint256 => HealthRecord) public healthRecords;
    mapping(address => uint256[]) public patientRecords;
    mapping(address => bool) public authorizedDoctors;
    
    // Events
    event HealthRecordAdded(
        uint256 indexed recordId,
        address indexed patient,
        string ipfsHash,
        string recordType,
        uint256 timestamp
    );
    
    event DoctorAuthorized(address indexed doctor, address indexed authorizer);
    event DoctorRevoked(address indexed doctor, address indexed revoker);
    
    // Modifiers
    modifier onlyPatientOrAuthorized(address patient) {
        require(
            msg.sender == patient || 
            hasRole(EMERGENCY_DOCTOR_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Unauthorized access to health records"
        );
        _;
    }
    
    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }
    
    modifier validIPFSHash(string memory ipfsHash) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        _;
    }
    
    /**
     * @dev Constructor sets up roles
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Add a new health record for a patient
     * @param patient Address of the patient
     * @param ipfsHash IPFS hash of the health record
     * @param recordType Type of health record
     */
    function addHealthRecord(
        address patient,
        string memory ipfsHash,
        string memory recordType
    ) 
        external 
        validAddress(patient)
        validIPFSHash(ipfsHash)
        nonReentrant
        returns (uint256)
    {
        require(
            msg.sender == patient || hasRole(ADMIN_ROLE, msg.sender),
            "Only patient or admin can add records"
        );
        
        _recordIdCounter.increment();
        uint256 newRecordId = _recordIdCounter.current();
        
        HealthRecord memory newRecord = HealthRecord({
            recordId: newRecordId,
            patientAddress: patient,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            recordType: recordType,
            isActive: true
        });
        
        healthRecords[newRecordId] = newRecord;
        patientRecords[patient].push(newRecordId);
        
        emit HealthRecordAdded(newRecordId, patient, ipfsHash, recordType, block.timestamp);
        
        return newRecordId;
    }
    
    /**
     * @dev Get all health record IDs for a patient
     * @param patient Address of the patient
     * @return Array of record IDs
     */
    function getPatientRecordIds(address patient)
        external
        view
        onlyPatientOrAuthorized(patient)
        returns (uint256[] memory)
    {
        return patientRecords[patient];
    }
    
    /**
     * @dev Get health record details by ID
     * @param recordId ID of the health record
     * @return HealthRecord struct
     */
    function getHealthRecord(uint256 recordId)
        external
        view
        returns (HealthRecord memory)
    {
        HealthRecord memory record = healthRecords[recordId];
        require(record.isActive, "Record not found or inactive");
        require(
            msg.sender == record.patientAddress ||
            hasRole(EMERGENCY_DOCTOR_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Unauthorized access to this record"
        );
        
        return record;
    }
    
    /**
     * @dev Get multiple health records by IDs
     * @param recordIds Array of record IDs
     * @return Array of HealthRecord structs
     */
    function getHealthRecords(uint256[] memory recordIds)
        external
        view
        returns (HealthRecord[] memory)
    {
        HealthRecord[] memory records = new HealthRecord[](recordIds.length);
        
        for (uint256 i = 0; i < recordIds.length; i++) {
            HealthRecord memory record = healthRecords[recordIds[i]];
            require(record.isActive, "One or more records not found");
            require(
                msg.sender == record.patientAddress ||
                hasRole(EMERGENCY_DOCTOR_ROLE, msg.sender) ||
                hasRole(ADMIN_ROLE, msg.sender),
                "Unauthorized access to records"
            );
            records[i] = record;
        }
        
        return records;
    }
    
    /**
     * @dev Authorize a doctor for emergency access
     * @param doctor Address of the doctor to authorize
     */
    function authorizeDoctorEmergencyAccess(address doctor)
        external
        onlyRole(ADMIN_ROLE)
        validAddress(doctor)
    {
        _grantRole(EMERGENCY_DOCTOR_ROLE, doctor);
        authorizedDoctors[doctor] = true;
        emit DoctorAuthorized(doctor, msg.sender);
    }
    
    /**
     * @dev Revoke doctor's emergency access
     * @param doctor Address of the doctor to revoke
     */
    function revokeDoctorEmergencyAccess(address doctor)
        external
        onlyRole(ADMIN_ROLE)
        validAddress(doctor)
    {
        _revokeRole(EMERGENCY_DOCTOR_ROLE, doctor);
        authorizedDoctors[doctor] = false;
        emit DoctorRevoked(doctor, msg.sender);
    }
    
    /**
     * @dev Get total number of records
     * @return Total record count
     */
    function getTotalRecords() external view returns (uint256) {
        return _recordIdCounter.current();
    }
    
    /**
     * @dev Check if an address has emergency doctor access
     * @param doctor Address to check
     * @return Boolean indicating access status
     */
    function hasEmergencyAccess(address doctor) external view returns (bool) {
        return hasRole(EMERGENCY_DOCTOR_ROLE, doctor);
    }
}
