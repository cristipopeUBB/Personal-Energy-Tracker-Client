import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { UserStoreService } from '../../services/user-store.service';
import { OpenAiService } from '../../services/open-ai.service';
import regression from 'regression';
import { Chart, registerables } from 'chart.js';
import { Observable, catchError, concat, concatMap, flatMap, forkJoin, map, merge, mergeMap, of, throwError } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  public users: any = [];
  public fullName: string = "";
  WeatherData: any = {
    isDay: true,
    temp_celcius: 0,
    temp_min: 0,
    temp_max: 0,
    temp_feels_like: 0,
    temp_icon: '',
    main: {
      humidity: 0,
    }
  };
  userId: number = 0;
  public userDevices: any = [];
  public userConsumption: any = 0;
  public isUserProsumer: any = false;
  public userMonthlyCost: any = 0;
  public totalDailyPowerOutput: number = 0;
  public dailyCostSaving: number = 0;
  editUserForm!: FormGroup;

  //location parameters
  latitude: number = 0;
  longitude: number = 0;

  //openAi parameters
  searchText: string = "";
  showOutput: boolean = false;
  output: string = "";
  isLoading: boolean = false;
  showChat: boolean = false;
  chatMessages: { text: string; sender: string }[] = [];
  public userSolarPanels: any = [];

  constructor(private api: ApiService, private auth: AuthService, private userStoreService: UserStoreService,
    private authService: AuthService, private openAiService: OpenAiService, private toast: NgToastService,
    private formBuilder: FormBuilder) {
    Chart.register(...registerables);
  }

  async ngOnInit() {
    await this.getLocation();
    this.WeatherData.isDay = true;
    this.api.getUsers()
      .subscribe(res => {
        this.users = res;
      });

    this.userStoreService.getFullNameFromStore()
      .subscribe(val => {
        let fullNameFromToken = this.auth.getFullNameFromToken();
        this.fullName = val || fullNameFromToken;
      });

    this.userStoreService.getFullNameFromStore()
      .subscribe(val => {
        let fullNameFromToken = this.authService.getFullNameFromToken();
        this.fullName = val || fullNameFromToken;
      });

    this.api.getUsers()
      .subscribe({
        next: (res: any) => {
          this.userId = res.find((user: any) => user.username === this.fullName).id;
          this.isUserProsumer = res.find((user: any) => user.username === this.fullName).isProsumer;
          this.loadData();
        },
        error: () => {
          console.log("Error");
        }
      });

    this.editUserForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
      id: ['', Validators.required]
    });
  }

  isAddDeviceModalOpen: boolean = false;

  // Method to open the modal
  openAddDeviceModal() {
    this.isAddDeviceModalOpen = true;
  }

  // Method to close the modal
  closeAddDeviceModal() {
    this.isAddDeviceModalOpen = false;
  }

  editUserSettings() {
    this.editUserForm.patchValue({ id: this.userId });
    this.api.editUser(this.editUserForm.value)
    .subscribe({
      next: (res: any) => {
        this.toast.success({
          detail: 'Success',
          summary: 'User settings updated successfully!',
          duration: 3000,
        });
      },
      error: () => {
        console.log("Error");
      }
    });
  }

  sendMessage(): void {
    if (this.searchText.trim() !== '') {
      this.chatMessages.push({ text: this.searchText, sender: 'user' });
      this.getSuggestion(); // Call method to get bot response
    }
  }

  getSuggestion() {
    this.isLoading = true;

    this.output = "";

    this.openAiService.getData(this.searchText)
      .subscribe({
        next: (res: any) => {
          this.output = res as string;
          this.showOutput = true;
          this.isLoading = false;
          this.searchText = "";
          this.chatMessages.push({ text: this.output, sender: 'bot' });
        },
        error: () => {
          console.log("Error");
          this.isLoading = false;
          this.searchText = "";
        }
      });
  }

  toggleChat() {
    this.showChat = !this.showChat;
    if (this.showChat) {
      // Reset loading state when chat is opened
      this.isLoading = false;
    }
  }

  logout() {
    this.auth.signOut();
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  calculateDailyCostSaving() {
    return Observable.create((observer: any) => {
      //daily cost saving = (total energy consumption - energy produced by solar panels) * electricity price
      let savedEnergy = this.userConsumption - this.totalDailyPowerOutput;
      if(savedEnergy <= 100) {
        this.dailyCostSaving = savedEnergy * 0.68;
      } else if(savedEnergy <= 255) {
        this.dailyCostSaving = 100 * 0.68 + (savedEnergy - 100) * 0.8;
      }
      else if(savedEnergy <= 300) {
        this.dailyCostSaving = 100 * 0.68 + (255 - 100) * 0.8 + (savedEnergy - 255) * 1.3;
      }
      else {
        this.dailyCostSaving = 100 * 0.68 + (255 - 100) * 0.8 + (300 - 255) * 1.3 + (savedEnergy - 300) * 1.3;
      }

      this.dailyCostSaving = Number(this.dailyCostSaving.toFixed(2));

      observer.next();
      observer.complete();
    });
  }

  // Formula for Solar Panel Power Output
  // Daily watt hours = Solar panel power * 6.06(hours of daylight in Romania) * 0.85(average efficiency)
  // Converted into kWh = Daily watt hours / 1000
  // Monthly watt hours = Daily watt hours * 30

  calculateDailyPowerOutput(power: number): number {
    return power * 6.06 * 0.85 / 1000;
  }

  calculateTotalDailyPowerOutput() {
    return Observable.create((observer: any) => {

      this.totalDailyPowerOutput = this.userSolarPanels.reduce((acc: number, solarPanel: any) => {
        return acc + this.calculateDailyPowerOutput(solarPanel.power) * solarPanel.quantity;
      }, 0).toFixed(2);

      observer.next();
      observer.complete();
    });
  }

  async getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          let latitude = position.coords.latitude;
          let longitude = position.coords.longitude;
          await this.getWeatherData(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000, // Timeout in milliseconds (optional)
          maximumAge: 0 // Maximum age of cached position (optional)
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  async getWeatherData(latitude: number, longitude: number) {
    let url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=d2feb633db3a1d7ffee4c93fec2dc30f`;

    try {
      let response = await fetch(url);
      if (response.ok) {
        let data = await response.json();
        this.setWeatherData(data);
      } else {
        console.error('Failed to fetch weather data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  }

  loadData() {
    concat(
      this.loadSolarPanelsOfCurrentUser().pipe(
        concatMap(() => this.calculateTotalDailyPowerOutput())
      ),
      this.loadDevicesOfCurrentUser().pipe(
        concatMap(() => this.populateRegressionChart()),
        concatMap(() => this.populateMostUsedDevicesChart()),
        concatMap(() => this.calculateTotalConsumption()),
        concatMap(() => this.calculateDailyCostSaving())
      )
    )
      .subscribe({
        error: (error) => {
          console.error('Error loading data:', error);
        }
      });
  }


  loadSolarPanelsOfCurrentUser() {
    return this.api.getUserSolarPanels(this.userId)
      .pipe(
        map((res: any[]) => {
          this.userSolarPanels = res.map(device => ({
            ...device,
          }));
          return this.userSolarPanels;
        }),
        catchError(error => {
          console.error('Error loading devices:', error);
          return throwError(error);
        })
      );
  }

  calculateTotalConsumption() {
    return this.calculateTotalDailyPowerOutput().pipe(
      concatMap(() => {
        const devices = this.userDevices;
        if (!devices || devices.length === 0) {
          this.userConsumption = 0;
          this.userMonthlyCost = 0;
          return of(0);
        }

        // the formula is Energy (kWh) = Power (W) × Time (h) / 1000
        this.userConsumption = devices.reduce((total: number, device: { consumption: number; hoursUsed: number; }) => total + (device.consumption * device.hoursUsed / 1000), 0);

        // the formula for monthly cost is Cost = Energy (kWh) × Price (per kWh)
        // the cost now should be updated according to the total power output of the solar panels
        let userConsumptionLocal = this.userConsumption;
        userConsumptionLocal -= this.totalDailyPowerOutput;
        if (this.userConsumption <= 100) {
          this.userMonthlyCost = userConsumptionLocal * 0.68;
        } else if (this.userConsumption <= 255) {
          this.userMonthlyCost = 100 * 0.68 + (userConsumptionLocal - 100) * 0.8;
        }
        else if (this.userConsumption <= 300) {
          this.userMonthlyCost = 100 * 0.68 + (255 - 100) * 0.8 + (userConsumptionLocal - 255) * 1.3;
        }
        else {
          this.userMonthlyCost = 100 * 0.68 + (255 - 100) * 0.8 + (300 - 255) * 1.3 + (userConsumptionLocal - 300) * 1.3;
        }
        // for one month (30 days) the formula is Cost = Energy (kWh) × Price (per kWh) × 30
        this.userMonthlyCost *= 30;
        // round to 2 decimal places
        this.userMonthlyCost = ((Math.round(this.userMonthlyCost * 100) / 100) / 4.6).toFixed(2);
        this.userConsumption = Math.round(this.userConsumption * 100) / 100;

        return of(this.userConsumption);
      })
    );
  }

  loadDevicesOfCurrentUser() {
    return this.api.getUserDevices(this.userId)
      .pipe(
        map((res: any[]) => {
          // Process the usage field of each device and convert it into a string
          this.userDevices = res.map(device => ({
            ...device,
            usageString: this.getUsageString(device.usage)
          }));
          return this.userDevices;
        }),
        catchError(error => {
          console.error('Error loading devices:', error);
          return throwError(error);
        })
      );
  }

  populateMostUsedDevicesChart() {
    return new Observable<any>(observer => {
      const devices = this.userDevices;
      if (!devices || devices.length === 0) {
        // If devices are not loaded yet, wait for them
        observer.error('User devices not loaded');
        return;
      }
  
      // Extract top 5 devices based on consumption
      const topDevices = this.userDevices.slice(0, 5);
  
      // Prepare data for the chart
      const chartData = {
        labels: topDevices.map((device: { name: any; }) => device.name),
        datasets: [{
          label: 'Top 5 devices with the highest consumption (W)',
          data: topDevices.map((device: { consumption: any; }) => device.consumption),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      };
  
      // Create the chart with a bar chart type
      const ctxMostExpensive = document.getElementById('mostConsumptionExpensiveDevicesChart') as HTMLCanvasElement;
      const myChartMostExpensive = new Chart(ctxMostExpensive, {
        type: 'bar', // Use bar chart type instead of line
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true // Start y-axis at 0
            }
          }
        }
      });
  
      // Notify that chart population is complete
      observer.next(myChartMostExpensive);
      observer.complete();
    });
  }
  
  

  populateRegressionChart() {
    return new Observable<any>(observer => {
      const devices = this.userDevices;
      if (!devices || devices.length === 0) {
        observer.error('User devices not loaded');
        return;
      }
  
      // Calculate the end date of the next month
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const endDateOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
  
      // Filter devices based on their date added to consider only devices added before next month
      const devicesAddedBeforeNextMonth = devices.filter((device: any) => new Date(device.dateAdded) < endDateOfNextMonth);
  
      // Prepare data for regression analysis
      const data = devicesAddedBeforeNextMonth.map((device: { hoursUsed: any; consumption: any; }) => [device.hoursUsed, device.consumption]);
  
      // Perform linear regression
      const result = regression.linear(data, { precision: 10 });
      const gradient = result.equation[0];
      const yIntercept = result.equation[1];
  
      // Predict consumption for each device for the next month using regression equation
      const predictions = devicesAddedBeforeNextMonth.map((device: any) => {
        const predictedConsumptionInW = gradient * device.consumption + yIntercept;
        const predictedConsumptionInkWh = predictedConsumptionInW / 1000; // Convert to kWh
  
        return {
          device,
          predictedConsumption: predictedConsumptionInkWh
        };
      });
  
      // Calculate historical consumption in kWh
      const historicalConsumption = devicesAddedBeforeNextMonth.map((device: any) => {
        return{ consumption: (device.consumption*device.hoursUsed*30) / 1000};// Convert to kWh
      });
  
      // Create the chart
      const ctx = document.getElementById('consumptionPredictionChart') as HTMLCanvasElement;
      const myChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: devicesAddedBeforeNextMonth.map((device: any) => device.name),
          datasets: [
            {
              label: 'Current Consumption this Month (kWh)',
              data: historicalConsumption.map((device: any) => device.consumption),
              borderColor: 'rgba(153, 102, 255, 1)', // Adjust line color
              borderWidth: 2, // Adjust line width
              pointStyle: 'circle', // Use circle as point style
              pointBackgroundColor: 'rgba(153, 102, 255, 1)', // Adjust point color
              pointBorderColor: 'rgba(153, 102, 255, 1)', // Adjust point border color
              pointRadius: 5, // Adjust point radius
              pointHoverRadius: 7 // Adjust point hover radius
            },
            {
              label: 'Predicted Consumption for Next Month (kWh)',
              data: predictions.map((prediction: any) => prediction.predictedConsumption),
              borderColor: 'rgba(75, 192, 192, 1)', // Adjust line color
              borderWidth: 2, // Adjust line width
              pointStyle: 'circle', // Use circle as point style
              pointBackgroundColor: 'rgba(75, 192, 192, 1)', // Adjust point color
              pointBorderColor: 'rgba(75, 192, 192, 1)', // Adjust point border color
              pointRadius: 5, // Adjust point radius
              pointHoverRadius: 7 // Adjust point hover radius
            }
          ]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value, index, values) {
                  return value + ' kWh'; // Append 'kWh' to each tick value
                }
              }
            },
            x: {
              display: true // Show the x-axis labels
            }
          }
        }
      });
  
      // Notify that chart population is complete
      observer.next(myChart);
      observer.complete();
    });
  }


  getUsageString(usage: DeviceUsage): string {
    switch (usage) {
      case DeviceUsage.Low:
        return 'Low';
      case DeviceUsage.Medium:
        return 'Medium';
      case DeviceUsage.High:
        return 'High';
      default:
        return '';
    }
  }

  setWeatherData(data: any) {
    this.WeatherData = data;
    let sunsetTime = new Date(this.WeatherData.sys.sunset * 1000);
    this.WeatherData.sunset_time = sunsetTime.toLocaleTimeString();
    let currentDate = new Date();
    this.WeatherData.isDay = currentDate.getTime() < sunsetTime.getTime();
    this.WeatherData.temp_celcius = (this.WeatherData.main.temp - 273.15).toFixed(0);
    this.WeatherData.temp_min = (this.WeatherData.main.temp_min - 273.15).toFixed(0);
    this.WeatherData.temp_max = (this.WeatherData.main.temp_max - 273.15).toFixed(0);
    this.WeatherData.temp_feels_like = (this.WeatherData.main.feels_like - 273.15).toFixed(0);
  }
}

export enum DeviceUsage {
  Low = 0,
  Medium = 1,
  High = 2
}
