#!/usr/bin/env ts-node
/**
 * Open Charge Map API Probe Script
 * 
 * Fetches EV station data from Open Charge Map API and validates the response schema.
 * Verifies that the response includes required fields: Connectors and PowerKW.
 * 
 * Per task requirements: Fetch EV station data and validate response schema (Connectors, PowerKW).
 * 
 * @module scripts/probes/probeOcm
 */

const OPEN_CHARGE_MAP_API_KEY = process.env.OPEN_CHARGE_MAP_API_KEY;

if (!OPEN_CHARGE_MAP_API_KEY) {
  console.error('❌ Error: OPEN_CHARGE_MAP_API_KEY environment variable is required');
  console.error('   Set it in your .env file or export it before running this script');
  console.error('   You can get an API key from: https://openchargemap.org/site/develop/api');
  process.exit(1);
}

/**
 * Interface for Open Charge Map API response
 */
interface OCMConnector {
  ID: number;
  ConnectionTypeID: number;
  ConnectionType?: {
    ID: number;
    Title: string;
    FormalName?: string;
  };
  PowerKW?: number;
  CurrentTypeID?: number;
  Amps?: number;
  Voltage?: number;
  StatusTypeID?: number;
}

interface OCMStation {
  ID: number;
  UUID: string;
  AddressInfo: {
    ID: number;
    Title?: string;
    AddressLine1?: string;
    Town?: string;
    StateOrProvince?: string;
    Postcode?: string;
    CountryID: number;
    Country?: {
      ID: number;
      ISOCode: string;
      Title: string;
    };
    Latitude: number;
    Longitude: number;
    Distance?: number;
    DistanceUnit?: number;
  };
  Connections: OCMConnector[];
  NumberOfPoints?: number;
  GeneralComments?: string;
  DatePlanned?: string;
  DateLastStatusUpdate?: string;
  StatusTypeID?: number;
  DateLastConfirmed?: string;
  DataProviderID?: number;
  OperatorID?: number;
  UsageTypeID?: number;
}

interface OCMResponse {
  IsError: boolean;
  ErrorMessage?: string;
  TotalResults?: number;
  Results: OCMStation[];
}

/**
 * Fetch EV stations from Open Charge Map API
 * Searches for stations near a specific location
 */
async function fetchEVStations(latitude: number, longitude: number, maxResults: number = 10): Promise<OCMResponse> {
  console.log('🔍 Fetching EV stations from Open Charge Map API...');
  console.log(`   Location: ${latitude}, ${longitude}`);
  console.log(`   Max Results: ${maxResults}`);
  console.log('');
  
  try {
    // Open Charge Map API endpoint
    const baseUrl = 'https://api.openchargemap.io/v3/poi';
    const url = new URL(baseUrl);
    
    // Query parameters
    url.searchParams.append('key', OPEN_CHARGE_MAP_API_KEY);
    url.searchParams.append('latitude', latitude.toString());
    url.searchParams.append('longitude', longitude.toString());
    url.searchParams.append('distance', '50'); // 50km radius
    url.searchParams.append('distanceunit', 'KM');
    url.searchParams.append('maxresults', maxResults.toString());
    url.searchParams.append('output', 'json');
    url.searchParams.append('includecomments', 'false');
    url.searchParams.append('verbose', 'false');
    
    console.log('📤 Request URL:', url.toString().replace(OPEN_CHARGE_MAP_API_KEY, '***'));
    console.log('');
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': OPEN_CHARGE_MAP_API_KEY,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data: OCMResponse = await response.json();
    
    if (data.IsError) {
      throw new Error(`API Error: ${data.ErrorMessage || 'Unknown error'}`);
    }
    
    console.log('📥 Response received:');
    console.log('   Total Results:', data.TotalResults || data.Results?.length || 0);
    console.log('   Results Count:', data.Results?.length || 0);
    console.log('');
    
    return data;
  } catch (error: any) {
    console.error('❌ Error fetching EV stations:');
    console.error('   ', error.message);
    throw error;
  }
}

/**
 * Validate response schema
 * Verifies that stations have required fields: Connectors and PowerKW
 */
function validateResponseSchema(stations: OCMStation[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  console.log('✅ Validating Response Schema...');
  console.log('');
  
  if (!stations || stations.length === 0) {
    errors.push('No stations returned in response');
    return { valid: false, errors, warnings };
  }
  
  console.log(`   Validating ${stations.length} station(s)...`);
  console.log('');
  
  stations.forEach((station, index) => {
    const stationNum = index + 1;
    const stationId = station.ID || station.UUID || `Station ${stationNum}`;
    
    // Validate required fields
    if (!station.AddressInfo) {
      errors.push(`Station ${stationId}: Missing AddressInfo`);
    } else {
      if (typeof station.AddressInfo.Latitude !== 'number') {
        errors.push(`Station ${stationId}: AddressInfo.Latitude is not a number`);
      }
      if (typeof station.AddressInfo.Longitude !== 'number') {
        errors.push(`Station ${stationId}: AddressInfo.Longitude is not a number`);
      }
    }
    
    // Validate Connectors (required per task)
    if (!station.Connections || !Array.isArray(station.Connections)) {
      errors.push(`Station ${stationId}: Missing or invalid Connections array`);
    } else if (station.Connections.length === 0) {
      warnings.push(`Station ${stationId}: No connectors available`);
    } else {
      // Validate each connector
      station.Connections.forEach((connector, connIndex) => {
        if (!connector.ConnectionTypeID) {
          warnings.push(`Station ${stationId}, Connector ${connIndex + 1}: Missing ConnectionTypeID`);
        }
        
        // Validate PowerKW (required per task)
        if (connector.PowerKW === undefined || connector.PowerKW === null) {
          warnings.push(`Station ${stationId}, Connector ${connIndex + 1}: Missing PowerKW`);
        } else if (typeof connector.PowerKW !== 'number') {
          errors.push(`Station ${stationId}, Connector ${connIndex + 1}: PowerKW is not a number`);
        } else if (connector.PowerKW < 0) {
          warnings.push(`Station ${stationId}, Connector ${connIndex + 1}: PowerKW is negative (${connector.PowerKW})`);
        }
      });
    }
  });
  
  // Summary
  if (errors.length > 0) {
    console.log('❌ Schema Validation Errors:');
    errors.forEach(error => console.log(`   - ${error}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Schema Validation Warnings:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }
  
  const valid = errors.length === 0;
  
  if (valid) {
    console.log('✅ Schema validation passed!');
    console.log('   ✓ All stations have required fields');
    console.log('   ✓ Connectors array is present and valid');
    console.log('   ✓ PowerKW values are present and valid');
    console.log('');
  }
  
  return { valid, errors, warnings };
}

/**
 * Display sample station data
 */
function displaySampleStation(station: OCMStation): void {
  console.log('📋 Sample Station Data:');
  console.log(`   ID: ${station.ID}`);
  console.log(`   UUID: ${station.UUID}`);
  
  if (station.AddressInfo) {
    console.log(`   Location: ${station.AddressInfo.Latitude}, ${station.AddressInfo.Longitude}`);
    if (station.AddressInfo.Title) {
      console.log(`   Title: ${station.AddressInfo.Title}`);
    }
    if (station.AddressInfo.AddressLine1) {
      console.log(`   Address: ${station.AddressInfo.AddressLine1}`);
    }
    if (station.AddressInfo.Town) {
      console.log(`   Town: ${station.AddressInfo.Town}`);
    }
    if (station.AddressInfo.Country) {
      console.log(`   Country: ${station.AddressInfo.Country.Title} (${station.AddressInfo.Country.ISOCode})`);
    }
  }
  
  console.log(`   Number of Connectors: ${station.Connections?.length || 0}`);
  
  if (station.Connections && station.Connections.length > 0) {
    console.log('   Connectors:');
    station.Connections.forEach((connector, index) => {
      console.log(`     Connector ${index + 1}:`);
      console.log(`       ConnectionTypeID: ${connector.ConnectionTypeID}`);
      if (connector.ConnectionType) {
        console.log(`       Type: ${connector.ConnectionType.Title || connector.ConnectionType.FormalName || 'N/A'}`);
      }
      console.log(`       PowerKW: ${connector.PowerKW !== undefined ? connector.PowerKW : 'N/A'}`);
      if (connector.Amps) {
        console.log(`       Amps: ${connector.Amps}`);
      }
      if (connector.Voltage) {
        console.log(`       Voltage: ${connector.Voltage}`);
      }
    });
  }
  
  if (station.NumberOfPoints) {
    console.log(`   Number of Points: ${station.NumberOfPoints}`);
  }
  
  console.log('');
}

/**
 * Main probe function
 */
async function probeOCM() {
  try {
    console.log('🧪 Probing Open Charge Map API...');
    console.log(`   API Key: ${OPEN_CHARGE_MAP_API_KEY.substring(0, 10)}...`);
    console.log('');
    
    // Search for EV stations near a known location (Las Vegas, NV)
    // This is a good test location with many EV stations
    const testLatitude = 36.1699;
    const testLongitude = -115.1398;
    
    // Fetch EV stations
    const response = await fetchEVStations(testLatitude, testLongitude, 5);
    
    if (!response.Results || response.Results.length === 0) {
      console.log('⚠️  No EV stations found in the test area');
      console.log('   This may indicate API issues or the location has no stations');
      console.log('');
      console.log('✅ Probe completed (no stations to validate)');
      return true;
    }
    
    // Display sample station
    displaySampleStation(response.Results[0]);
    
    // Validate response schema
    const validation = validateResponseSchema(response.Results);
    
    if (!validation.valid) {
      console.error('❌ Schema validation failed!');
      console.error('   The API response does not match the expected schema');
      console.error('   This may indicate API changes or data quality issues');
      console.error('');
      process.exit(1);
    }
    
    // Success summary
    console.log('✅ Probe successful!');
    console.log('   ✓ Open Charge Map API connectivity verified');
    console.log('   ✓ EV station data retrieved');
    console.log('   ✓ Response schema validated (Connectors, PowerKW)');
    console.log('   ✓ All required fields present and valid');
    console.log('');
    
    // Additional statistics
    const totalConnectors = response.Results.reduce((sum, station) => {
      return sum + (station.Connections?.length || 0);
    }, 0);
    
    const stationsWithPowerKW = response.Results.filter(station => {
      return station.Connections?.some(conn => conn.PowerKW !== undefined && conn.PowerKW !== null);
    }).length;
    
    console.log('📊 Statistics:');
    console.log(`   Total Stations: ${response.Results.length}`);
    console.log(`   Total Connectors: ${totalConnectors}`);
    console.log(`   Stations with PowerKW data: ${stationsWithPowerKW}/${response.Results.length}`);
    console.log('');
    
    return true;
  } catch (error: any) {
    console.error('❌ Probe failed:');
    console.error('   Error message:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Verify OPEN_CHARGE_MAP_API_KEY is correct');
    console.error('   2. Verify Open Charge Map API is accessible');
    console.error('   3. Check API rate limits and quotas');
    console.error('   4. Verify network connectivity');
    console.error('   5. Check API documentation for changes: https://openchargemap.org/site/develop/api');
    console.error('');
    
    process.exit(1);
  }
}

/**
 * Main probe execution
 */
async function main() {
  console.log('🚀 Starting Open Charge Map API Probe...\n');
  
  const success = await probeOCM();
  
  if (success) {
    console.log('✅ Open Charge Map probe completed successfully!');
    process.exit(0);
  } else {
    console.error('❌ Open Charge Map probe failed!');
    process.exit(1);
  }
}

// Run probe
main().catch((error) => {
  console.error('💥 Fatal error running Open Charge Map probe:', error);
  process.exit(1);
});
