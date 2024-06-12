import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NgToastService } from 'ng-angular-popup';
import { UserStoreService } from '../../services/user-store.service';
import { Observable, catchError, map, mergeMap, throwError } from 'rxjs';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-prosumer',
  templateUrl: './prosumer.component.html',
  styleUrl: './prosumer.component.scss'
})
export class ProsumerComponent {

  public solarPanels: { [key: string]: number } = {
    "SunPower X-Series": 350,
    "LG Solar NeON 2": 350,
    "LG Solar NeOn R": 370,
    "Panasonic HIT": 340,
    "Canadian Solar HiKu": 380,
    "Canadian Solar KuMax": 370,
    "Jinko Solar Cheetah": 380,
    "Jinko Solar Tiger": 430,
    "Trina Solar Vertex": 430,
    "Trina Solar Honey": 370,
    "Hanwha Q CELLS Q.PEAK DUO": 345,
    "Hanwha Q.MAXX": 355,
    "LONGI Solar Hi-MO 4": 430,
    "LONGI Solar Hi-MO X": 450,
    "Risen Energy Jaegar": 400,
    "Risen Energy Titan": 500,
  }

  addSolarPanelForm!: FormGroup;
  editUserForm!: FormGroup;
  userId: number = 0;
  fullName: string = '';
  public userSolarPanels: any = [];

  currentPage: number = 1;

  constructor(private apiService: ApiService, private formBuilder: FormBuilder,
    private toast: NgToastService, private authService: AuthService, private userStoreService: UserStoreService) {
    Chart.register(...registerables);
  }

  ngOnInit() {
    this.userStoreService.getFullNameFromStore()
      .subscribe(val => {
        let fullNameFromToken = this.authService.getFullNameFromToken();
        this.fullName = val || fullNameFromToken;
      });

    this.apiService.getUsers()
      .subscribe({
        next: (res: any) => {
          this.userId = res.find((user: any) => user.username === this.fullName).id;
          this.loadSolarPanelsOfCurrentUser().pipe(
            mergeMap(() => this.initializeSolarPanelsConsumptionChart()),
            catchError(error => {
              console.error('Error loading solar panels:', error);
              return throwError(error);
            })).subscribe({
              next: () => {
                // Devices loaded successfully, now populate userDevices
              }
            });
        },
        error: () => {
          console.log("Error");
        }
      });

    this.addSolarPanelForm = this.formBuilder.group({
      name: ['', Validators.required],
      quantity: ['', Validators.required],
      userId: ['', Validators.required],
      power: ['', Validators.required]
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

  loadSolarPanelsOfCurrentUser() {
    return this.apiService.getUserSolarPanels(this.userId)
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

  logout() {
    this.authService.signOut();
  }

  getSolarPanelNames(): string[] {
    return Object.keys(this.solarPanels);
  }

  editUserSettings() {
    this.editUserForm.patchValue({ id: this.userId });
    this.apiService.editUser(this.editUserForm.value)
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

  deleteSolarPanel(solarPanel: any) {
    if (!confirm('Are you sure you want to delete this solar panel?')) {
      return;
    }

    this.apiService.deleteSolarPanel(solarPanel.id)
      .subscribe({
        next: (res: any) => {
          //reset the table data
          this.loadSolarPanelsOfCurrentUser().subscribe({
            next: () => {
              this.initializeSolarPanelsConsumptionChart().subscribe({
                next: () => {
                  console.log('Solar Panel chart updated');
                }
              });
            }
          });

          this.toast.success({
            detail: 'Success',
            summary: 'Solar panel deleted successfully!',
            duration: 3000,
          });
        },
        error: () => {
          console.log("Error");
        }
      });
  }

  initializeSolarPanelsConsumptionChart() {

    return new Observable<any>(observer => {

      var chartExist = Chart.getChart("solarPanelsConsumptionChart"); // <canvas> id
      if (chartExist != undefined) {
        chartExist.destroy(); 
      }

      // Formula for Solar Panel Power Output
      // Daily watt hours = Solar panel power * 6.06(hours of daylight in Romania) * 0.85(average efficiency)
      // Converted into kWh = Daily watt hours / 1000
      // Monthly watt hours = Daily watt hours * 30
      // Converted into kWh = Monthly watt hours / 1000

      const solarPanels = this.userSolarPanels;
      const labels = solarPanels.map((solarPanel: any) => solarPanel.name);
      const data = solarPanels.map((solarPanel: any) => {
        const dailyWattHours = solarPanel.quantity* (solarPanel.power * 6.06 * 0.85);
        const monthlyWattHours = dailyWattHours * 30;
        const monthlyKWh = monthlyWattHours / 1000;
        return monthlyKWh;
      });

      var ctx = document.getElementById('solarPanelsConsumptionChart') as HTMLCanvasElement;
      var solarPanelsConsumptionChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Monthly energy produced (kWh)',
            data: data,
            backgroundColor: 'rgba(54, 62, 235, 0.2)',
            borderColor: 'rgba(54, 162, 135, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            },
            x: {
              display: false
            }
          }
        }
      });

      observer.next(solarPanelsConsumptionChart);
      observer.complete();

    });
  }

  addSolarPanel() {
    if (this.addSolarPanelForm.value.name === '') {
      this.toast.error({
        detail: 'ERROR',
        summary: 'Please select a solar panel!',
        duration: 3000,
      });
      return;
    }

    this.addSolarPanelForm.patchValue({ userId: this.userId });
    const powerProduced = this.solarPanels[this.addSolarPanelForm.value.name];

    // Set the data in the form
    this.addSolarPanelForm.patchValue({
      power: powerProduced
    });

    // Submit the form
    this.apiService.addSolarPanel(this.addSolarPanelForm.value)
      .subscribe({
        next: (res: any) => {
          console.log(res);
          //reset the table data
          this.loadSolarPanelsOfCurrentUser().subscribe({
            next: () => {
              //reset the form
              document.getElementById('closeAddDeviceModalBtn')?.click(); // close the modal
              this.addSolarPanelForm.reset();
              this.initializeSolarPanelsConsumptionChart().subscribe({
                next: () => {
                  console.log('Solar Panel chart updated');
                }
              });
            }
          });

          this.toast.success({
            detail: 'Success',
            summary: 'Solar panel added successfully!',
            duration: 3000,
          });
        },
        error: () => {
          console.log("Error");
        }
      });
  }
}
