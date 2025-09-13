"""
IPFS Service for Dristi AI Blockchain Integration
Handles storing and retrieving health records and metadata on IPFS
"""

import json
import hashlib
import base64
import requests
from datetime import datetime
from typing import Dict, Any, Optional, List
import os
from PIL import Image
import io

class IPFSService:
    """Service for interacting with IPFS for decentralized storage"""
    
    def __init__(self, ipfs_url: str = "http://127.0.0.1:5001"):
        """
        Initialize IPFS service
        
        Args:
            ipfs_url: URL of IPFS node API
        """
        self.ipfs_url = ipfs_url
        self.api_url = f"{ipfs_url}/api/v0"
        
    def _make_request(self, endpoint: str, method: str = "POST", files=None, data=None) -> Dict[str, Any]:
        """
        Make HTTP request to IPFS API
        
        Args:
            endpoint: API endpoint
            method: HTTP method
            files: Files to upload
            data: Form data
            
        Returns:
            Response data
        """
        url = f"{self.api_url}/{endpoint}"
        
        try:
            if method == "POST":
                response = requests.post(url, files=files, data=data, timeout=30)
            else:
                response = requests.get(url, params=data, timeout=30)
                
            response.raise_for_status()
            return response.json() if response.content else {}
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"IPFS request failed: {str(e)}")
    
    def store_health_record(self, 
                          patient_address: str,
                          record_type: str,
                          record_data: Dict[str, Any],
                          image_data: Optional[bytes] = None) -> str:
        """
        Store health record on IPFS
        
        Args:
            patient_address: Ethereum address of patient
            record_type: Type of health record
            record_data: Health record data
            image_data: Optional image data (fundus scan, etc.)
            
        Returns:
            IPFS hash of stored record
        """
        # Create comprehensive health record
        health_record = {
            "patient_address": patient_address,
            "record_type": record_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": record_data,
            "version": "1.0",
            "metadata": {
                "created_by": "dristi_ai",
                "encryption": "none",  # Can be enhanced with encryption
                "format": "json"
            }
        }
        
        # Add image hash if provided
        if image_data:
            image_hash = self.store_image(image_data, f"{record_type}_image")
            health_record["image_hash"] = image_hash
        
        # Convert to JSON and store
        record_json = json.dumps(health_record, indent=2)
        
        try:
            files = {'file': ('health_record.json', record_json, 'application/json')}
            response = self._make_request("add", files=files)
            
            ipfs_hash = response.get('Hash')
            if not ipfs_hash:
                raise Exception("Failed to get IPFS hash from response")
                
            return ipfs_hash
            
        except Exception as e:
            raise Exception(f"Failed to store health record on IPFS: {str(e)}")
    
    def store_image(self, image_data: bytes, filename: str = "image") -> str:
        """
        Store image on IPFS
        
        Args:
            image_data: Image bytes
            filename: Name for the image file
            
        Returns:
            IPFS hash of stored image
        """
        try:
            # Validate image data
            img = Image.open(io.BytesIO(image_data))
            img.verify()
            
            # Store on IPFS
            files = {'file': (f'{filename}.jpg', image_data, 'image/jpeg')}
            response = self._make_request("add", files=files)
            
            ipfs_hash = response.get('Hash')
            if not ipfs_hash:
                raise Exception("Failed to get IPFS hash from response")
                
            return ipfs_hash
            
        except Exception as e:
            raise Exception(f"Failed to store image on IPFS: {str(e)}")
    
    def store_nft_metadata(self, 
                          achievement_type: str,
                          name: str,
                          description: str,
                          image_hash: str,
                          attributes: List[Dict[str, Any]] = None) -> str:
        """
        Store NFT metadata on IPFS
        
        Args:
            achievement_type: Type of achievement
            name: NFT name
            description: NFT description
            image_hash: IPFS hash of the image
            attributes: NFT attributes
            
        Returns:
            IPFS hash of metadata
        """
        metadata = {
            "name": name,
            "description": description,
            "image": f"ipfs://{image_hash}",
            "external_url": "https://dristi-ai.com",
            "attributes": attributes or [
                {
                    "trait_type": "Achievement Type",
                    "value": achievement_type
                },
                {
                    "trait_type": "Platform",
                    "value": "Dristi AI"
                },
                {
                    "trait_type": "Category",
                    "value": "Health Achievement"
                }
            ],
            "background_color": "000000",
            "animation_url": None,
            "youtube_url": None
        }
        
        try:
            metadata_json = json.dumps(metadata, indent=2)
            files = {'file': ('metadata.json', metadata_json, 'application/json')}
            response = self._make_request("add", files=files)
            
            ipfs_hash = response.get('Hash')
            if not ipfs_hash:
                raise Exception("Failed to get IPFS hash from response")
                
            return ipfs_hash
            
        except Exception as e:
            raise Exception(f"Failed to store NFT metadata on IPFS: {str(e)}")
    
    def retrieve_data(self, ipfs_hash: str) -> Dict[str, Any]:
        """
        Retrieve data from IPFS
        
        Args:
            ipfs_hash: IPFS hash of the data
            
        Returns:
            Retrieved data
        """
        try:
            response = self._make_request(f"cat?arg={ipfs_hash}", method="GET")
            
            # If response is already a dict, return it
            if isinstance(response, dict):
                return response
                
            # If response is a string, try to parse as JSON
            if isinstance(response, str):
                return json.loads(response)
                
            raise Exception("Unexpected response format")
            
        except Exception as e:
            raise Exception(f"Failed to retrieve data from IPFS: {str(e)}")
    
    def retrieve_image(self, ipfs_hash: str) -> bytes:
        """
        Retrieve image from IPFS
        
        Args:
            ipfs_hash: IPFS hash of the image
            
        Returns:
            Image bytes
        """
        try:
            url = f"{self.api_url}/cat?arg={ipfs_hash}"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            return response.content
            
        except Exception as e:
            raise Exception(f"Failed to retrieve image from IPFS: {str(e)}")
    
    def pin_data(self, ipfs_hash: str) -> bool:
        """
        Pin data to prevent garbage collection
        
        Args:
            ipfs_hash: IPFS hash to pin
            
        Returns:
            Success status
        """
        try:
            data = {'arg': ipfs_hash}
            self._make_request("pin/add", data=data)
            return True
            
        except Exception as e:
            print(f"Failed to pin data: {str(e)}")
            return False
    
    def get_node_info(self) -> Dict[str, Any]:
        """
        Get IPFS node information
        
        Returns:
            Node information
        """
        try:
            return self._make_request("id", method="GET")
        except Exception as e:
            raise Exception(f"Failed to get node info: {str(e)}")
    
    def is_online(self) -> bool:
        """
        Check if IPFS node is online
        
        Returns:
            Online status
        """
        try:
            self.get_node_info()
            return True
        except:
            return False
    
    def create_health_record_metadata(self,
                                    record_type: str,
                                    test_results: Dict[str, Any],
                                    doctor_notes: str = "",
                                    recommendations: List[str] = None) -> Dict[str, Any]:
        """
        Create standardized health record metadata
        
        Args:
            record_type: Type of health record
            test_results: Test results data
            doctor_notes: Doctor's notes
            recommendations: Health recommendations
            
        Returns:
            Formatted health record metadata
        """
        return {
            "record_type": record_type,
            "test_results": test_results,
            "doctor_notes": doctor_notes,
            "recommendations": recommendations or [],
            "severity_level": test_results.get("severity", "unknown"),
            "confidence_score": test_results.get("confidence", 0.0),
            "ai_analysis": test_results.get("ai_analysis", {}),
            "created_at": datetime.utcnow().isoformat(),
            "format_version": "1.0"
        }

# Global IPFS service instance
ipfs_service = IPFSService()

def get_ipfs_service() -> IPFSService:
    """Get the global IPFS service instance"""
    return ipfs_service
