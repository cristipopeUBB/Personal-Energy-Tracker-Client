import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ResetPassword } from '../../models/reset-password.model';
import { confirmPasswordValidator } from '../../helpers/confirm-password.validator';
import { ActivatedRoute, Router } from '@angular/router';
import ValidateForm from '../../helpers/validateform';
import { ResetPasswordService } from '../../services/reset-password.service';
import { NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit{
  resetPasswordForm! : FormGroup;
  emailToReset! : string;
  emailToken! : string;
  resetPasswordObj = new ResetPassword();

  constructor(
    private fb : FormBuilder, 
    private activatedRoute: ActivatedRoute,
    private resetPasswordService : ResetPasswordService,
    private toast: NgToastService,
    private router: Router) { }

  ngOnInit(): void {
    this.resetPasswordForm = this.fb.group({
      password: [null, Validators.required],
      confirmPassword: [null, Validators.required]
    }, {
      validator: confirmPasswordValidator("password", "confirmPassword")
    });

    this.activatedRoute.queryParams.subscribe(val => {
      this.emailToReset = val['email'];
      this.emailToken = val['token'].replace(/ /g, '+');

      console.log(this.emailToken);
    })
  }

  resetPassword() {
    if(this.resetPasswordForm.valid) {
      this.resetPasswordObj.email = this.emailToReset;
      this.resetPasswordObj.newPassword = this.resetPasswordForm.value.password;
      this.resetPasswordObj.confirmPassword = this.resetPasswordForm.value.confirmPassword;
      this.resetPasswordObj.emailToken = this.emailToken;

      this.resetPasswordService.resetPassword(this.resetPasswordObj)
        .subscribe({
          next:(res) => {
            this.toast.success({
              detail:"SUCCESS",
              summary: "Password reset successfully",
              duration: 3000,
            });
            this.router.navigate(['/']);
          },
          error: (err) => {
            this.toast.error({
              detail:"ERROR",
              summary: "Something went wrong! Please try again.",
              duration: 5000,
            });
          }
        })
    }
    else {
      ValidateForm.validateAllFormFields(this.resetPasswordForm);
    }
  }
}
