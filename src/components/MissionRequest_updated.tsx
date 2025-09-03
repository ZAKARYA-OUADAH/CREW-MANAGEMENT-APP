// This file has been replaced by the enhanced MissionRequest.tsx with useCrewManagement
// This file can be safely deleted

export default function MissionRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { allCrew, refreshCrewData, loading, apiConnected } = useCrewData();
  const { 
    aircraft, 
    loading: aircraftLoading, 
    error: aircraftError,
    refreshAircraft,
    getAircraftByRegistration 
  } = useAircraftData();
  
  const {
    qualifications,
    loading: qualificationsLoading,
    error: qualificationsError,
    refreshQualifications,
    getValidQualifications,
    getQualificationsByType
  } = useQualificationsData();
  
  // Get data from AdminDashboard if available
  const { selectedFlights: dashboardFlights, missionData: dashboardMissionData } = location.state || {};
  
  const [formData, setFormData] = useState({
    aircraftId: dashboardMissionData?.aircraftId || '',
    position: '',
    startDate: dashboardMissionData?.startDate || '',
    endDate: dashboardMissionData?.endDate || '',
    notes: dashboardMissionData?.notes || ''
  });
  const [filteredCrew, setFilteredCrew] = useState(allCrew || []);
  const [selectedFlights, setSelectedFlights] = useState(dashboardFlights || []);
  
  const { addNotification, showToast } = useNotifications();

  // Log data received from AdminDashboard
  React.useEffect(() => {
    if (dashboardFlights && dashboardFlights.length > 0) {
      console.log('MissionRequest - Received data from AdminDashboard:', {
        flights: dashboardFlights,
        missionData: dashboardMissionData
      });
    }
  }, [dashboardFlights, dashboardMissionData]);

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Filter crew based on criteria
    let filtered = allCrew || [];
    
    // First, exclude admin users from the crew list
    filtered = filtered.filter(crew => crew && crew.role !== 'admin');
    
    if (newFormData.aircraftId) {
      const selectedAircraft = aircraft.find(ac => ac.id === newFormData.aircraftId);
      if (selectedAircraft) {
        // Filter crew by aircraft type using qualifications table
        filtered = filtered.filter(crew => {
          if (!crew || !crew.id) return false;
          
          // Check if crew has valid type rating for this aircraft
          const crewQualifications = qualifications.filter(qual => 
            qual.user_id === crew.id && 
            qual.valid &&
            qual.type === 'type_rating' &&
            qual.aircraft_type &&
            (!qual.expiry_date || new Date(qual.expiry_date) > new Date())
          );
          
          // Check if any qualification matches the aircraft type or registration
          const hasAircraftQualification = crewQualifications.some(qual => 
            qual.aircraft_type?.toLowerCase().includes(selectedAircraft.type.toLowerCase()) ||
            qual.aircraft_type?.toLowerCase().includes(selectedAircraft.registration.toLowerCase())
          );
          
          // Fallback to legacy qualifications array if no qualifications table data
          if (crewQualifications.length === 0) {
            return crew.qualifications && Array.isArray(crew.qualifications) && 
                   crew.qualifications.includes(selectedAircraft.registration);
          }
          
          return hasAircraftQualification;
        });
      }
    }
    
    if (newFormData.position) {
      filtered = filtered.filter(crew => {
        if (!crew || !crew.id) return false;
        
        // Check if crew has valid position qualification in qualifications table
        const positionQualifications = qualifications.filter(qual => 
          qual.user_id === crew.id && 
          qual.valid &&
          (qual.type === 'competency' || qual.type === 'license') &&
          qual.level === newFormData.position &&
          (!qual.expiry_date || new Date(qual.expiry_date) > new Date())
        );
        
        // Fallback to legacy position field if no qualifications table data
        if (positionQualifications.length === 0) {
          return crew.position === newFormData.position;
        }
        
        return positionQualifications.length > 0;
      });
    }
    
    setFilteredCrew(filtered);

    // Auto-populate flights based on selected aircraft (only if we have flights)
    if (field === 'aircraftId' && value) {
      const selectedAircraft = aircraft.find(ac => ac.id === value);
      if (selectedAircraft) {
        const relevantFlights = flightData.filter(flight => flight.aircraftId === selectedAircraft.id);
        // Only set flights if we don't already have pre-filled flights from dashboard
        if (!dashboardFlights || dashboardFlights.length === 0) {
          setSelectedFlights(relevantFlights);
        }
      }
    } else if (field === 'aircraftId' && !value) {
      // Clear flights when aircraft is deselected (only if not from dashboard)
      if (!dashboardFlights || dashboardFlights.length === 0) {
        setSelectedFlights([]);
      }
    }
  };

  const getCrewStatusIcon = (crew: any) => {
    if (!crew) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    if (crew.availability === 'busy') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (crew.missing_docs && crew.missing_docs.length > 0) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getCrewStatusText = (crew: any) => {
    if (!crew) return 'Unknown';
    if (crew.availability === 'busy') return 'Busy';
    if (crew.missing_docs && crew.missing_docs.length > 0) return `${crew.missing_docs.length} docs missing`;
    return 'Available';
  };

  const getMissingDocsText = (missingDocs: string[] = []) => {
    const docNames = {
      medical: 'Medical',
      license: 'License',
      passport: 'Passport',
      phone: 'Phone',
      address: 'Address',
      emergency_contact: 'Emergency Contact'
    };
    
    return missingDocs.map(doc => docNames[doc] || doc).join(', ');
  };

  const getQualificationsBadges = (crewQualifications: string[], requiredAircraftId?: string, crewId?: string) => {
    // Get qualifications from the qualifications table for this crew member
    const dbQualifications = crewId ? qualifications.filter(qual => 
      qual.user_id === crewId && 
      qual.valid &&
      (!qual.expiry_date || new Date(qual.expiry_date) > new Date())
    ) : [];
    
    const selectedAircraft = requiredAircraftId ? aircraft.find(ac => ac.id === requiredAircraftId) : null;
    
    // If we have database qualifications, use those
    if (dbQualifications.length > 0) {
      const typeRatings = dbQualifications.filter(qual => qual.type === 'type_rating');
      const positions = dbQualifications.filter(qual => qual.type === 'competency' || qual.type === 'license');
      
      if (typeRatings.length === 0 && positions.length === 0) {
        return '-';
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {/* Show aircraft type ratings */}
          {typeRatings.slice(0, 2).map((qual, index) => {
            const isRequired = selectedAircraft && 
              (qual.aircraft_type?.toLowerCase().includes(selectedAircraft.type.toLowerCase()) ||
               qual.aircraft_type?.toLowerCase().includes(selectedAircraft.registration.toLowerCase()));
            return (
              <Badge 
                key={`type-${index}`} 
                variant="outline" 
                className={`text-xs ${
                  isRequired 
                    ? 'bg-green-100 text-green-800 border-green-400 font-medium' 
                    : 'bg-blue-50 text-blue-700 border-blue-300'
                }`}
              >
                {qual.aircraft_type || qual.code}
              </Badge>
            );
          })}
          
          {/* Show positions */}
          {positions.slice(0, 1).map((qual, index) => (
            <Badge 
              key={`pos-${index}`} 
              variant="outline" 
              className="text-xs bg-purple-50 text-purple-700 border-purple-300"
            >
              {qual.level}
            </Badge>
          ))}
          
          {(typeRatings.length + positions.length) > 3 && (
            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500">
              +{(typeRatings.length + positions.length) - 3}
            </Badge>
          )}
        </div>
      );
    }
    
    // Fallback to legacy qualifications array
    if (!crewQualifications || crewQualifications.length === 0) return '-';
    
    const requiredRegistration = selectedAircraft?.registration;
    
    return (
      <div className="flex flex-wrap gap-1">
        {crewQualifications.slice(0, 2).map((qual, index) => {
          const aircraftInfo = aircraft.find(ac => ac.registration === qual);
          const isRequired = qual === requiredRegistration;
          return (
            <Badge 
              key={index} 
              variant="outline" 
              className={`text-xs ${
                isRequired 
                  ? 'bg-green-100 text-green-800 border-green-400 font-medium' 
                  : 'bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              {qual}
              {aircraftInfo && ` (${aircraftInfo.type})`}
            </Badge>
          );
        })}
        {crewQualifications.length > 2 && (
          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500">
            +{crewQualifications.length - 2}
          </Badge>
        )}
      </div>
    );
  };

  const handleRequestType = (crewId: string, requestType: 'extra_day' | 'freelance' | 'service') => {
    const crew = filteredCrew.find(c => c && c.id === crewId);
    if (!crew) {
      console.error('Crew member not found:', crewId);
      showToast('error', 'Error', 'Selected crew member not found. Please try again.');
      return;
    }

    // Ensure crew has all required fields for the mission request
    const enrichedCrew = {
      ...crew,
      name: crew.name || 'Unknown',
      position: crew.position || 'Unknown',
      type: crew.type || 'freelancer',
      ggid: crew.ggid || 'N/A',
      email: crew.email || '',
      phone: crew.phone || '',
      address: crew.address || '',
      qualifications: crew.qualifications || [],
      emergencyContact: crew.emergencyContact || null,
      licenseNumber: crew.licenseNumber || '',
      medicalExpiry: crew.medicalExpiry || '',
      passportNumber: crew.passportNumber || '',
      missing_docs: crew.missing_docs || []
    };

    // Prepare mission data
    const selectedAircraft = aircraft.find(ac => ac.id === formData.aircraftId);
    const missionData = {
      aircraftId: formData.aircraftId,
      aircraftRegistration: selectedAircraft?.registration || '',
      aircraftType: selectedAircraft?.type || '',
      position: formData.position,
      startDate: formData.startDate,
      endDate: formData.endDate,
      notes: formData.notes
    };

    console.log('Navigating to mission request detail with data:', {
      crew: enrichedCrew,
      requestType,
      selectedFlights: selectedFlights.length > 0 ? selectedFlights : [],
      missionData,
      crewFields: Object.keys(enrichedCrew)
    });

    // Navigate to detail page with state
    navigate('/mission-request/new', {
      state: {
        crew: enrichedCrew,
        requestType,
        selectedFlights: selectedFlights.length > 0 ? selectedFlights : [],
        missionData
      }
    });
  };

  const handleNotifyToComplete = (crewId: string) => {
    const crew = filteredCrew.find(c => c && c.id === crewId);
    if (!crew) return;

    const missingDocsText = getMissingDocsText(crew.missing_docs);

    showToast('success', 'Notification Sent', `Reminded ${crew.name} to complete missing documents`);
    
    // Add local notification only (no backend call since it might not exist)
    addNotification({
      type: 'warning',
      title: 'Document Reminder Sent',
      message: `Notified ${crew.name} to complete missing documents: ${missingDocsText}`,
      category: 'document',
      metadata: { crewId, missingDocs: crew.missing_docs }
    });
  };

  const selectedAircraftData = aircraft.find(ac => ac.id === formData.aircraftId);

  // Get description for crew list header
  const getCrewListDescription = () => {
    const crewCount = filteredCrew ? filteredCrew.length : 0;
    const selectedAircraftData = aircraft.find(ac => ac.id === formData.aircraftId);
    const aircraftName = selectedAircraftData?.registration || '';
    
    if (!formData.aircraftId && !formData.position) {
      return `${crewCount} crew members available`;
    }
    if (formData.aircraftId && formData.position) {
      return `${crewCount} crew members qualified for ${formData.position} on ${aircraftName}`;
    }
    if (formData.aircraftId) {
      return `${crewCount} crew members qualified on ${aircraftName}`;
    }
    if (formData.position) {
      return `${crewCount} crew members in ${formData.position} position`;
    }
    return `${crewCount} crew members match your criteria`;
  };

  // Update filtered crew when allCrew changes or when form data changes
  React.useEffect(() => {
    let filtered = allCrew || [];
    
    // First, exclude admin users from the crew list
    filtered = filtered.filter(crew => crew && crew.role !== 'admin');
    
    if (formData.aircraftId) {
      const selectedAircraftData = aircraft.find(ac => ac.id === formData.aircraftId);
      if (selectedAircraftData) {
        filtered = filtered.filter(crew => {
          if (!crew || !crew.id) return false;
          
          // Check if crew has valid type rating for this aircraft
          const crewQualifications = qualifications.filter(qual => 
            qual.user_id === crew.id && 
            qual.valid &&
            qual.type === 'type_rating' &&
            qual.aircraft_type &&
            (!qual.expiry_date || new Date(qual.expiry_date) > new Date())
          );
          
          // Check if any qualification matches the aircraft type or registration
          const hasAircraftQualification = crewQualifications.some(qual => 
            qual.aircraft_type?.toLowerCase().includes(selectedAircraftData.type.toLowerCase()) ||
            qual.aircraft_type?.toLowerCase().includes(selectedAircraftData.registration.toLowerCase())
          );
          
          // Fallback to legacy qualifications array if no qualifications table data
          if (crewQualifications.length === 0) {
            return crew.qualifications && Array.isArray(crew.qualifications) && 
                   crew.qualifications.includes(selectedAircraftData.registration);
          }
          
          return hasAircraftQualification;
        });
      }
    }
    
    if (formData.position) {
      filtered = filtered.filter(crew => {
        if (!crew || !crew.id) return false;
        
        // Check if crew has valid position qualification in qualifications table
        const positionQualifications = qualifications.filter(qual => 
          qual.user_id === crew.id && 
          qual.valid &&
          (qual.type === 'competency' || qual.type === 'license') &&
          qual.level === formData.position &&
          (!qual.expiry_date || new Date(qual.expiry_date) > new Date())
        );
        
        // Fallback to legacy position field if no qualifications table data
        if (positionQualifications.length === 0) {
          return crew.position === formData.position;
        }
        
        return positionQualifications.length > 0;
      });
    }
    
    setFilteredCrew(filtered);
  }, [allCrew, formData.aircraftId, formData.position, aircraft, qualifications]);

  // Initial filtering when dashboard data is loaded
  React.useEffect(() => {
    if (dashboardMissionData?.aircraftId) {
      // Filter crew automatically based on pre-filled aircraft
      let filtered = allCrew || [];
      
      // First, exclude admin users from the crew list
      filtered = filtered.filter(crew => crew && crew.role !== 'admin');
      
      const selectedAircraftData = aircraft.find(ac => ac.id === dashboardMissionData.aircraftId);
      if (selectedAircraftData) {
        filtered = filtered.filter(crew => {
          if (!crew || !crew.id) return false;
          
          // Check if crew has valid type rating for this aircraft
          const crewQualifications = qualifications.filter(qual => 
            qual.user_id === crew.id && 
            qual.valid &&
            qual.type === 'type_rating' &&
            qual.aircraft_type &&
            (!qual.expiry_date || new Date(qual.expiry_date) > new Date())
          );
          
          // Check if any qualification matches the aircraft type or registration
          const hasAircraftQualification = crewQualifications.some(qual => 
            qual.aircraft_type?.toLowerCase().includes(selectedAircraftData.type.toLowerCase()) ||
            qual.aircraft_type?.toLowerCase().includes(selectedAircraftData.registration.toLowerCase())
          );
          
          // Fallback to legacy qualifications array if no qualifications table data
          if (crewQualifications.length === 0) {
            return crew.qualifications && Array.isArray(crew.qualifications) && 
                   crew.qualifications.includes(selectedAircraftData.registration);
          }
          
          return hasAircraftQualification;
        });
      }
      
      setFilteredCrew(filtered);
    }
  }, [allCrew, dashboardMissionData?.aircraftId, aircraft, qualifications]);

  const hasNoFlights = !selectedFlights || selectedFlights.length === 0;
  const hasValidPeriod = formData.startDate && formData.endDate;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-gray-900">Mission Request</h1>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshCrewData}
            className="text-blue-600"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh Crew Data'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshAircraft}
            className="text-green-600"
            disabled={aircraftLoading}
          >
            {aircraftLoading ? 'Loading...' : 'Refresh Aircraft'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshQualifications}
            className="text-purple-600"
            disabled={qualificationsLoading}
          >
            {qualificationsLoading ? 'Loading...' : 'Refresh Qualifications'}
          </Button>
        </div>
      </div>

      {/* Pre-filled Data Info */}
      {dashboardFlights && dashboardFlights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm text-blue-800">Data from Dashboard</h3>
              <p className="text-xs text-blue-600 mt-1">
                Pre-filled with {dashboardFlights.length} selected flight{dashboardFlights.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Period Mission Info - Show when no specific flights */}
      {hasNoFlights && hasValidPeriod && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Info className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm text-amber-800">Period Mission</h3>
              <p className="text-xs text-amber-600 mt-1">
                This mission request covers the period from {new Date(formData.startDate).toLocaleDateString()} to {new Date(formData.endDate).toLocaleDateString()} without specific flights. Crew will be assigned for the entire duration.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Request Form */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Mission Details</CardTitle>
            <p className="text-sm text-gray-600">Define mission requirements and criteria</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="aircraft">Aircraft Registration</Label>
                {aircraftError && (
                  <Badge variant="outline" className="text-xs text-red-600">
                    Error loading aircraft
                  </Badge>
                )}
                {aircraftLoading && (
                  <Badge variant="outline" className="text-xs text-blue-600">
                    Loading...
                  </Badge>
                )}
              </div>
              <Select 
                value={formData.aircraftId} 
                onValueChange={(value) => handleInputChange('aircraftId', value)}
                disabled={aircraftLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft.map(aircraftItem => (
                    <SelectItem key={aircraftItem.id} value={aircraftItem.id}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{aircraftItem.registration}</span>
                        <span className="text-xs text-gray-500">({aircraftItem.type})</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            aircraftItem.status === 'available' 
                              ? 'text-green-700 bg-green-50' 
                              : aircraftItem.status === 'maintenance'
                              ? 'text-amber-700 bg-amber-50'
                              : 'text-red-700 bg-red-50'
                          }`}
                        >
                          {aircraftItem.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <PositionSelect
              value={formData.position}
              onValueChange={(value) => handleInputChange('position', value)}
              label="Position Required"
              placeholder="Select a position"
              required={false}
            />

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional requirements or notes..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Crew List */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Available Crew Members</span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {getCrewListDescription()}
                </p>
              </div>
              <NotificationStatusIndicator />
            </div>
          </CardHeader>
          <CardContent>
            {filteredCrew.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No crew members match your criteria</p>
                <p className="text-sm mt-1">
                  Try adjusting your aircraft or position selection
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Crew Member</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Qualifications</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCrew.map((crew) => (
                      <TableRow key={crew?.id || Math.random()}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {crew?.name ? crew.name.charAt(0) : '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{crew?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">
                                {crew?.position || 'No Position'} • {crew?.type || 'Unknown'}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {crew?.ggid || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getCrewStatusIcon(crew)}
                            <span className="text-sm">
                              {getCrewStatusText(crew)}
                            </span>
                          </div>
                          {crew?.missing_docs && crew.missing_docs.length > 0 && (
                            <div className="mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleNotifyToComplete(crew.id)}
                                className="text-xs h-6"
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Notify to Complete
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getQualificationsBadges(
                            crew?.qualifications || [],
                            formData.aircraftId,
                            crew?.id
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              onClick={() => handleRequestType(crew?.id, 'extra_day')}
                              className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                              disabled={!crew?.id}
                            >
                              Extra Day
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestType(crew?.id, 'freelance')}
                              className="text-xs h-8"
                              disabled={!crew?.id}
                            >
                              Freelance
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestType(crew?.id, 'service')}
                              className="text-xs h-8"
                              disabled={!crew?.id}
                            >
                              Service
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}