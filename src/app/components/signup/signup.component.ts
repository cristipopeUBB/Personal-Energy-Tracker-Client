import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import ValidateForm from '../../helpers/validateform';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent  implements OnInit{
  signUpForm!: FormGroup;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router,
    private toast: NgToastService) { }

  ngOnInit(): void {
    this.signUpForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      userName: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
    })
  }

  onSignup(){
    if(this.signUpForm.valid){
      this.authService.signUp(this.signUpForm.value)
        .subscribe({
          next:(res => {
            this.signUpForm.reset();
            this.router.navigate(['login']);
            this.toast.success({detail: "SUCCESS", summary: res.message, duration: 5000});
          }),
          error:(err =>{
            this.toast.error({detail: "ERROR", summary: err?.error.message, duration: 5000});
          })
        })
    }
    else{
      ValidateForm.validateAllFormFields(this.signUpForm);
    }
  }
}
