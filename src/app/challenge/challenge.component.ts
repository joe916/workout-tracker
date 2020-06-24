import { Component, OnInit } from '@angular/core';
import { ChallengeService } from '../core/challenge.service';
import { Router } from '@angular/router';
import { UserService } from '../core/user.service';
import * as _ from 'underscore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-challenge',
  templateUrl: './challenge.component.html',
  styleUrls: ['./challenge.component.scss']
})
export class ChallengeComponent implements OnInit {

  constructor(
    public challengeService: ChallengeService,
    private router: Router,
    private userService: UserService,
    private fb: FormBuilder,
    private db: AngularFirestore
  ) { }

  user;
  showChallengeForm = false;
  challengeForm: FormGroup;
  challengeFormInvalid = false;

  ngOnInit() {
    this.userService.getCurrentUser().then((user) => {
      this.user = user;
      this.userService.updateUserTable(_.pick(user, 'displayName', 'email', 'uid', 'photoURL'));
    });
    this.userService.getUsers();
    this.challengeForm = this.fb.group(
      {
        name: ['', Validators.required],
        startDate: ['', Validators.required],
        startTime: ['', Validators.required],
        endDate: ['', Validators.required],
        endTime: ['', Validators.required]
      }
    );
  }

  joinChallenge(event, id, name) {
    this.challengeService.joinChallenge(id, this.user.uid);
    this.viewChallenge(event, id, name);
  }

  viewChallenge(event, id, name) {
    event.stopPropagation();
    event.preventDefault();
    this.router.navigate(['/user'], { queryParams: { 'challengeId': id, 'challengeName': name } });
  }

  createChallenge(event) {
    event.stopPropagation();
    event.preventDefault();
    this.challengeFormInvalid = false;
    this.showChallengeForm = !this.showChallengeForm;
  }

  deleteChallenge(event, id, name) {
    event.stopPropagation();
    event.preventDefault();
    this.challengeService.deleteChallenge(id);
  }

  onSubmit(event){
    let formData = this.challengeForm.value;
    if (!formData.name || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      this.challengeFormInvalid = true;
      return;
    }
    let start = new Date(formData.startDate + ' ' + formData.startTime);
    let end = new Date(formData.endDate + ' ' + formData.endTime);
    let now = new Date();
    if (start > end || end < now) {
      this.challengeFormInvalid = true;
      return;
    }
    let challenge = {
      id: Math.floor((Math.random() * 100000) + 1),
      name: formData.name,
      start: start,
      end: end,
      ownerId: this.user.uid,
      owner: this.user.displayName
    };
    return this.db.collection('challenges').add(challenge).then((ref) => {
      this.challengeForm.reset();
      this.showChallengeForm = false;
      this.challengeFormInvalid = false;
    });;
  }
}
