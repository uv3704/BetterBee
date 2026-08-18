import os
import sys

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

# Add parent directory to path to load settings if needed
from dotenv import load_dotenv

load_dotenv()

bucket_name = os.getenv("S3_BUCKET_NAME", "betterbee-docs")
region = os.getenv("S3_REGION", "ap-south-1")
access_key = os.getenv("AWS_ACCESS_KEY_ID")
secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

print("Testing S3 Connection:")
print(f"  Bucket: {bucket_name}")
print(f"  Region: {region}")
print(f"  Access Key: {access_key[:8] if access_key else 'None'}...")
print(f"  Secret Key: {secret_key[:8] if secret_key else 'None'}...")

if not access_key or not secret_key:
    print("Error: AWS Credentials are not set in environment!")
    sys.exit(1)

# Set short timeouts so it fails fast if there's a network/proxy issue
config = Config(
    connect_timeout=3,
    read_timeout=3,
    retries={'max_attempts': 0}
)

session = boto3.Session(
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    region_name=region
)
s3 = session.client('s3', config=config)

try:
    # 1. Test connection and check if bucket exists
    print("\n1. Checking if bucket exists...")
    s3.head_bucket(Bucket=bucket_name)
    print(f"   Success: Bucket '{bucket_name}' exists and is accessible!")
except ClientError as e:
    error_code = e.response.get('Error', {}).get('Code')
    if error_code == '404':
        print(f"   Error: Bucket '{bucket_name}' does not exist.")
    elif error_code == '403':
        print(f"   Error: Access Denied to bucket '{bucket_name}' (check policy or keys).")
    else:
        print(f"   Error checking bucket: {e}")
    sys.exit(1)
except Exception as e:
    print(f"   Error connecting/checking bucket: {e}")
    sys.exit(1)

# 2. Test write/read permission
try:
    print("\n2. Testing write and read permissions...")
    test_key = "test_connectivity_file.txt"
    test_content = b"Connectivity test content"

    # Upload
    s3.put_object(Bucket=bucket_name, Key=test_key, Body=test_content)
    print("   Success: Uploaded test object.")

    # Download
    response = s3.get_object(Bucket=bucket_name, Key=test_key)
    downloaded_content = response['Body'].read()
    if downloaded_content == test_content:
        print("   Success: Downloaded test object and content matches.")
    else:
        print("   Warning: Downloaded content does not match!")

    # Delete
    s3.delete_object(Bucket=bucket_name, Key=test_key)
    print("   Success: Deleted test object.")
except Exception as e:
    print(f"   Error during read/write test: {e}")
    sys.exit(1)

# 3. Check CORS configuration
try:
    print("\n3. Checking CORS configuration...")
    cors = s3.get_bucket_cors(Bucket=bucket_name)
    print("   CORS Configuration found:")
    for rule in cors.get('CORSRules', []):
        print(f"     AllowedOrigins: {rule.get('AllowedOrigins')}")
        print(f"     AllowedMethods: {rule.get('AllowedMethods')}")
        print(f"     AllowedHeaders: {rule.get('AllowedHeaders')}")
        print(f"     ExposeHeaders: {rule.get('ExposeHeaders')}")
except ClientError as e:
    error_code = e.response.get('Error', {}).get('Code')
    if error_code == 'NoSuchCORSConfiguration':
        print("   Warning: No CORS configuration found on this bucket!")
        print("   IMPORTANT: Direct uploads from the browser will FAIL due to CORS issues.")
        print("   You must add a CORS configuration to allow PUT requests from your frontend (http://localhost:3000).")
    else:
        print(f"   Error retrieving CORS configuration: {e}")
except Exception as e:
    print(f"   Error checking CORS: {e}")

print("\nS3 Test Complete!")
